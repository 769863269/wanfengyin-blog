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
 *
 * ⚠️ 可达性（与 scripts/lib/nav.mjs 同一套规则）：
 *   只有「已发布 且（开启 directAccess 或 已被导航菜单引用）」的页面才注册路由。
 *   已发布但两者都没有 = 未上线 → 不注册，前台 /page/<slug> 走 404。
 *
 * 由 build-posts.mjs 之后的同步链自动触发，也可手动 `npm run pages`。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, markdownToBlocks } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'
import { navReferencedSlugs, isPageReachable, isTrue } from './lib/nav.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pagesDir = join(root, 'content', 'pages')
const siteFile = join(root, 'content', 'site.json')
const outputFile = join(root, 'src', 'data', 'pages.generated.ts')

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,49}$/

function fail(file, message) {
  console.error(`[pages] ${file}: ${message}`)
  process.exit(1)
}

// 菜单引用（site.json 缺失/损坏时视为没有菜单引用：宁可不注册路由，也不放行）
let navSlugs = new Set()
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
const seen = new Set()
let skipped = 0 // 草稿
let offline = 0 // 已发布但未上线（没进菜单、没开直链）
let viaMenu = 0 // 靠菜单引用上线

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  if (!SLUG_RE.test(slug)) fail(file, 'slug 只能是小写字母 / 数字 / 连字符，且以字母或数字开头')
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
    // 完整 HTML 独立页：整篇正文原样存为 rawHtml，交给 PageView 的 iframe 隔离渲染。
    // 不做 markdown 块解析——用户写的是含 script/style 的完整文档，解析只会破坏它。
    pages.push({
      slug,
      title: String(data.title),
      description: String(data.description ?? ''),
      fullHtml: true,
      rawHtml: body || '',
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
    '）' +
    (highlighted || degraded ? `（代码块高亮 ${highlighted}，降级 ${degraded}）` : ''),
)

if (offline) {
  console.warn(
    `[pages] 提示：有 ${offline} 个页面已发布但未上线（未加入导航菜单、也没开启「允许直接访问」），前台 /page/<slug> 会返回 404。`,
  )
}
