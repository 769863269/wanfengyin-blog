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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownToBlocks, blocksToHtml, escapeHtml } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'
import { ArticleError, readAllArticles } from './lib/articles.mjs'

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
// 部署 base（如 /wanfengyin-blog/）：数据里的根路径资源（封面图）要拼上前缀，
// 否则子路径部署下静态 HTML 里的 <img src="/images/..."> 会 404
const basePath = siteDomain ? new URL(siteDomain).pathname.replace(/\/$/, '') : ''

/* ---------- 文章数据：与 build-posts.mjs 共用同一解析层，避免两处漂移 ---------- */

const articlesDir = join(root, 'articles')

let articles
try {
  ;({ articles } = readAllArticles(articlesDir))
} catch (err) {
  if (err instanceof ArticleError) {
    console.error(`[prerender] ${err.message}`)
    process.exit(1)
  }
  throw err
}

const posts = articles.map(({ meta, body }) => ({ ...meta, blocks: markdownToBlocks(body) }))

// 代码块高亮与 build-posts.mjs 同步：静态 HTML 里的代码也带 Shiki 配色
for (const post of posts) {
  for (const block of post.blocks) {
    if (block.type !== 'code') continue
    const html = await highlightToCodeHtml(block.text, block.lang)
    if (html) block.codeHtml = html
  }
}

/* ---------- 预渲染 ---------- */

const shell = readFileSync(shellPath, 'utf8')

function seoTags(title, description, path, image, keywords) {
  const imageTag = image
    ? `\n    <meta property="og:image" content="${siteDomain}${image}" />`
    : ''
  const keywordsTag = keywords?.length
    ? `\n    <meta name="keywords" content="${escapeHtml(keywords.join(', '))}" />`
    : ''
  return [
    `    <link rel="canonical" href="${siteDomain}${path}" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:type" content="article" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${siteDomain}${path}" />${imageTag}${keywordsTag}`,
  ].join('\n  ')
}

function renderArticle(post) {
  const cover = post.cover
    ? `\n        <figure class="post-detail__cover"><img src="${escapeHtml(basePath + post.cover)}" alt="${escapeHtml(post.title)} 封面" decoding="async" /></figure>`
    : ''
  // 文章目录：与 PostView 一致，2 个以上标题才渲染
  const headings = post.blocks.filter((block) => block.type === 'heading')
  const toc =
    headings.length >= 2
      ? `\n        <details class="post-detail__toc"><summary>📑 本文目录（${headings.length} 节）</summary><ol>${headings
          .map(
            (h) =>
              `<li><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`,
          )
          .join('')}</ol></details>`
      : ''
  return `<div class="layout__main"><article class="card post-detail">
        <header class="post-detail__header">
          <h1 class="post-detail__title">${escapeHtml(post.title)}</h1>
          <div class="post-detail__meta">
            <span>🕒 <time datetime="${post.publishedAt}">${post.publishedAt}</time></span>
            <span>👁 ${post.views} 阅读</span>
            <span>💬 ${post.commentCount} 评论</span>
          </div>
        </header>${cover}${toc}
        <div class="article-body">
${blocksToHtml(post.blocks)}
        </div>
      </article></div>`
}

/**
 * 正文数据块：让客户端首帧直接复用，避免「Vue 挂载清空预渲染内容 → 再等异步
 * chunk 到达」造成的闪烁。
 *
 * 用 type="application/json" 而非可执行脚本：浏览器不执行它，CSP 的 script-src
 * 也就不适用（站点 CSP 是 script-src 'self'，没有内联脚本额度）。
 * 必须放在 #app 之外，否则会被 Vue 挂载时一并清掉。
 */
function bodyDataTag(post) {
  // '<' 转义，防止正文里出现 </script> 把标签提前闭合
  const json = JSON.stringify(post.blocks).replaceAll('<', '\\u003c')
  return `  <script type="application/json" id="post-body-data" data-slug="${escapeHtml(post.slug)}">${json}</script>`
}

function prerenderPost(post) {
  const path = `/post/${post.slug}`
  let html = shell
  const description = post.seoDescription || post.excerpt

  // 1. 替换 title 与 description
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(post.title)}</title>`)
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeHtml(description)}$2`,
  )

  // 2. 注入 canonical / og / keywords 标签
  html = html.replace('</head>', `${seoTags(post.title, description, path, post.cover, post.keywords)}\n  </head>`)

  // 3. 注入静态正文（Vue 挂载后会整体接管 #app，此内容仅供爬虫与首屏）
  html = html.replace('<div id="app"></div>', `<div id="app">${renderArticle(post)}</div>`)

  // 4. 内联本篇正文数据（见 bodyDataTag 注释）
  html = html.replace('</body>', `${bodyDataTag(post)}\n</body>`)

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
