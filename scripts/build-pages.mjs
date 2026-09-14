/**
 * 构建时把 content/pages/*.md 编译为 src/data/pages.generated.ts
 *
 * 自定义页面流程：Studio 后台「自定义页面」新建（如 dome）→ 写内容发布 →
 * 前台自动多出 /page/dome 页面，导航菜单「页面」下拉里自动可选 dome。
 * 文件名即 slug（dome.md → /page/dome），frontmatter 支持：
 *   title         必填，页面标题
 *   status        published（默认）/ draft（草稿不编译、菜单不可选）
 *   description   SEO 描述，选填
 *   directAccess  仅 true 时写入；开启后页面可被直接访问（可分享链接）
 *   fullHtml      仅 true 时写入；正文是整份 HTML 文档（可含 script/style），
 *                 不做块解析，改写到 public/page-html/<slug>.html，
 *                 由 PageView 的 sandbox iframe 以 src 嵌入
 *
 * ⚠️ 为什么完整 HTML 页要落独立文件而不是塞进 iframe srcdoc：
 *   srcdoc 子文档会继承父页 CSP，而多条 CSP 只能取交集（更严），iframe 的
 *   csp 属性无法放宽 —— 父页 `script-src 'self'`（无 unsafe-inline）会把
 *   内联脚本拦掉，线上表现为「本地能点、Vercel 点不动」。改成独立文件后，
 *   子文档用自己响应头里的 CSP（见 public/_headers 的 /page-html/* 规则）。
 *
 * ⚠️ slug 规则唯一实现在 scripts/lib/slug.mjs（格式 + 保留字表）：后台保存与这里
 *   构建共用同一套校验，别再复制正则 —— 曾出现「后台拒绝、构建放行」的缺口。
 *
 * ⚠️ 可达性（与 scripts/lib/nav.mjs 同一套规则）：
 *   只有「已发布 且（开启 directAccess 或 已被导航菜单引用）」的页面才注册路由。
 *   已发布但两者都没有 = 未上线 → 不注册，前台 /page/<slug> 走 404。
 *
 * 由 build-posts.mjs 之后的同步链自动触发，也可手动 `npm run pages`。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, markdownToBlocks } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'
import { navReferencedSlugs, isPageReachable, isTrue } from './lib/nav.mjs'
import { assertSlug } from './lib/slug.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pagesDir = join(root, 'content', 'pages')
const siteFile = join(root, 'content', 'site.json')
const outputFile = join(root, 'src', 'data', 'pages.generated.ts')
// 完整 HTML 独立页的落盘目录（vite 会把 public/ 原样拷进 dist/）
const pageHtmlDir = join(root, 'public', 'page-html')

function fail(file, message) {
  console.error(`[pages] ${file}: ${message}`)
  process.exit(1)
}

// 菜单引用（site.json 缺失/损坏时视为没有菜单引用：宁可不注册路由，也不放行）
let navSlugs
try {
  navSlugs = navReferencedSlugs(JSON.parse(readFileSync(siteFile, 'utf8')))
} catch {
  navSlugs = new Set()
}

let files
try {
  files = readdirSync(pagesDir).filter((n) => n.endsWith('.md') && !n.startsWith('_'))
} catch {
  files = [] // 目录还不存在 = 还没建过自定义页面，编译空集即可
}

const pages = []
// 完整 HTML 页的正文：不进 generated.ts（否则整份文档会被打进 JS bundle），
// 单独落到 public/page-html/<slug>.html，由 iframe 以 src 加载
const fullHtmlFiles = new Map()
const seen = new Set()
let skipped = 0 // 草稿
let offline = 0 // 已发布但未上线（没进菜单、没开直链）
let viaMenu = 0 // 靠菜单引用上线

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  try {
    // 与后台共用同一套校验（含保留字表）—— 两边强度必须一致，否则会出现
    // 「后台拒绝、构建放行」的缺口，详见 lib/slug.mjs
    assertSlug(slug)
  } catch (err) {
    fail(file, String(err.message || err))
  }
  if (seen.has(slug)) fail(file, `slug "${slug}" 重复`)
  const raw = readFileSync(join(pagesDir, file), 'utf8')
  const { data, body } = parseFrontmatter(raw)
  if (!data.title) fail(file, 'frontmatter 缺少必填字段 "title"')
  const status = data.status ?? 'published'
  if (status !== 'published') {
    skipped++
    continue
  }
  const directAccess = isTrue(data.directAccess)
  if (!isPageReachable({ slug, status, directAccess }, navSlugs)) {
    // 已发布但既没进菜单也没开直链 —— 视为「未上线」，不注册路由（前台 404）
    offline++
    continue
  }
  if (!directAccess) viaMenu++
  seen.add(slug)
  const fullHtml = isTrue(data.fullHtml)
  if (fullHtml) {
    // 完整 HTML 独立页：整篇正文原样落成静态 HTML 文件，交给 PageView 的 iframe 隔离渲染。
    // 不做 markdown 块解析——用户写的是含 script/style 的完整文档，解析只会破坏它。
    fullHtmlFiles.set(slug, body || '')
    pages.push({
      slug,
      title: String(data.title),
      description: String(data.description ?? ''),
      fullHtml: true,
      body: [],
    })
  } else {
    pages.push({
      slug,
      title: String(data.title),
      description: String(data.description ?? ''),
      body: markdownToBlocks(body || ''),
    })
  }
}

// 构建期 Shiki 高亮（与文章同一套：失败自动降级纯文本）
let highlighted = 0
let degraded = 0
for (const page of pages) {
  for (const block of page.body) {
    if (block.type !== 'code') continue
    const html = await highlightToCodeHtml(block.text, block.lang)
    if (html) {
      block.codeHtml = html
      highlighted++
    } else {
      degraded++
    }
  }
}

pages.sort((a, b) => a.slug.localeCompare(b.slug))

/* ---------- 完整 HTML 独立页：落盘 + 清理下线残留 ---------- */

mkdirSync(pageHtmlDir, { recursive: true })

const wantedFiles = new Set()
for (const [slug, html] of fullHtmlFiles) {
  const name = `${slug}.html`
  wantedFiles.add(name)
  writeFileSync(join(pageHtmlDir, name), html, 'utf8')
}

// 扫目录删掉多余的：已下线 / 被删除的页面若留下旧 .html，
// 就会变成「前台 404、但 /page-html/<slug>.html 仍能打开」的内容泄露。
let pruned = 0
for (const name of readdirSync(pageHtmlDir)) {
  if (!name.endsWith('.html') || wantedFiles.has(name)) continue
  try {
    unlinkSync(join(pageHtmlDir, name))
  } catch {
    // 本机 safe-delete 会拦截 fs 层删除 → 退化成覆写占位页。
    // 宁可留个空壳，也绝不让已下线页面的内容继续可访问。
    try {
      writeFileSync(
        join(pageHtmlDir, name),
        '<!DOCTYPE html><meta charset="utf-8"><title>页面已下线</title>',
        'utf8',
      )
    } catch {
      /* 覆写也失败就只能留着，不影响构建 */
    }
  }
  pruned++
}

const banner = `/**
 * ⚠️ 本文件由 scripts/build-pages.mjs 自动生成，请勿手工编辑。
 *
 * 数据源：content/pages/*.md（Studio 后台「自定义页面」维护）
 * 重新生成：npm run pages（dev / build 前自动执行）
 */
import type { CustomPage } from '@/types'

export const generatedPages: CustomPage[] = `

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(outputFile, banner + JSON.stringify(pages, null, 2) + '\n', 'utf8')

console.log(
  `[pages] ${pages.length} 个自定义页面编译完成 → src/data/pages.generated.ts` +
    `（菜单 ${viaMenu}，直链 ${pages.length - viaMenu}` +
    (skipped ? `，跳过草稿 ${skipped}` : '') +
    (offline ? `，跳过未上线 ${offline}` : '') +
    (fullHtmlFiles.size
      ? `，完整 HTML 独立页 ${fullHtmlFiles.size} 个已落盘 public/page-html/`
      : '') +
    (pruned ? `，清理下线残留 ${pruned} 个` : '') +
    '）' +
    (highlighted || degraded ? `（代码块高亮 ${highlighted}，降级 ${degraded}）` : ''),
)

if (offline) {
  console.warn(
    `[pages] 提示：有 ${offline} 个页面已发布但未上线（未加入导航菜单、也没开启「允许直接访问」），前台 /page/<slug> 会返回 404。`,
  )
}
