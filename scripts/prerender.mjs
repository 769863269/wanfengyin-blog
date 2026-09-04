/**
 * 构建后预渲染（SEO）
 *
 * 背景：SPA 只有一份空 HTML，百度等不执行 JS 的爬虫收录为零。
 * 本脚本在 vite build 之后运行（npm postbuild 钩子），为每篇文章生成
 * 一份带完整 title / description / og 标签 + 正文 HTML 的静态页面。
 *
 * 工作方式：
 *   - 以 dist/index.html 为壳，替换 head 元信息；
 *   - 把文章正文渲染成静态 HTML 注入 #app —— 爬虫直接读到全文；
 *   - 浏览器加载后 Vue 照常挂载接管 #app，用户行为无感知；
 *   - 正文 HTML 由 scripts/lib/markdown.mjs 渲染，类名与
 *     ArticleBody.vue 完全对齐，JS 生效前后样式一致。
 *
 * 另生成 dist/404.html（SPA 壳）：GitHub Pages 等静态托管没有
 * rewrite，刷新 /post/xxx 会 404 —— 404.html 返回 SPA 壳后，
 * vue-router 根据 pathname 正常渲染对应页面。
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, markdownToBlocks, blocksToHtml, escapeHtml } from './lib/markdown.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')
const shellPath = join(distDir, 'index.html')

try {
  readFileSync(shellPath)
} catch {
  console.error('[prerender] dist/index.html 不存在，请先运行 npm run build')
  process.exit(1)
}

/* ---------- 站点信息（从 site.ts 提取，避免双处维护） ---------- */

const siteSource = readFileSync(join(root, 'src', 'config', 'site.ts'), 'utf8')
const domainMatch = siteSource.match(/export const domain = '([^']+)'/)
const siteDomain = domainMatch ? domainMatch[1] : ''

/* ---------- 从 articles/*.md 重建文章数据（与 build-posts.mjs 同源） ---------- */

const articlesDir = join(root, 'articles')
// README.md 与 _ 开头文件是文档，不是文章（与 build-posts.mjs 保持一致）
const files = readdirSync(articlesDir).filter(
  (name) => name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_'),
)

const posts = files
  .map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(join(articlesDir, file), 'utf8'))
    return {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      publishedAt: data.publishedAt,
      views: Number(data.views ?? 0),
      commentCount: Number(data.commentCount ?? 0),
      blocks: markdownToBlocks(body),
    }
  })
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

/* ---------- 预渲染 ---------- */

const shell = readFileSync(shellPath, 'utf8')

function seoTags(title, description, path) {
  return [
    `    <link rel="canonical" href="${siteDomain}${path}" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:type" content="article" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${siteDomain}${path}" />`,
  ].join('\n  ')
}

function renderArticle(post) {
  return `<div class="layout__main"><article class="card post-detail">
        <header class="post-detail__header">
          <h1 class="post-detail__title">${escapeHtml(post.title)}</h1>
          <div class="post-detail__meta">
            <span>🕒 <time datetime="${post.publishedAt}">${post.publishedAt}</time></span>
            <span>👁 ${post.views} 阅读</span>
            <span>💬 ${post.commentCount} 评论</span>
          </div>
        </header>
        <div class="article-body">
${blocksToHtml(post.blocks)}
        </div>
      </article></div>`
}

function prerenderPost(post) {
  const path = `/post/${post.slug}`
  let html = shell

  // 1. 替换 title 与 description
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(post.title)}</title>`)
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeHtml(post.excerpt)}$2`,
  )

  // 2. 注入 canonical / og 标签
  html = html.replace('</head>', `${seoTags(post.title, post.excerpt, path)}\n  </head>`)

  // 3. 注入静态正文（Vue 挂载后会整体接管 #app，此内容仅供爬虫与首屏）
  html = html.replace('<div id="app"></div>', `<div id="app">${renderArticle(post)}</div>`)

  const outDir = join(distDir, 'post', post.slug)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html, 'utf8')
}

for (const post of posts) {
  prerenderPost(post)
}

// 404.html = SPA 壳：静态托管的 history 路由 fallback
writeFileSync(join(distDir, '404.html'), shell, 'utf8')

console.log(`[prerender] ${posts.length} 篇文章预渲染完成 + 404.html`)
