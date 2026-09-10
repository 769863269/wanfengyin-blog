/**
 * 构建时把 content/pages/*.md 编译为 src/data/pages.generated.ts
 *
 * 自定义页面流程：Studio 后台「自定义页面」新建（如 dome）→ 写内容发布 →
 * 前台自动多出 /page/dome 页面，导航菜单「页面」下拉里自动可选 dome。
 * 文件名即 slug（dome.md → /page/dome），frontmatter 支持：
 *   title       必填，页面标题
 *   status      published（默认）/ draft（草稿不编译、菜单不可选）
 *   description SEO 描述，选填
 *
 * 由 build-posts.mjs 之后的同步链自动触发，也可手动 `npm run pages`。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, markdownToBlocks } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pagesDir = join(root, 'content', 'pages')
const outputFile = join(root, 'src', 'data', 'pages.generated.ts')

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,49}$/

function fail(file, message) {
  console.error(`[pages] ${file}: ${message}`)
  process.exit(1)
}

let files
try {
  files = readdirSync(pagesDir).filter((n) => n.endsWith('.md') && !n.startsWith('_'))
} catch {
  files = [] // 目录还不存在 = 还没建过自定义页面，编译空集即可
}

const pages = []
const seen = new Set()
let skipped = 0

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
  seen.add(slug)
  pages.push({
    slug,
    title: String(data.title),
    description: String(data.description ?? ''),
    body: markdownToBlocks(body || ''),
  })
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
    (skipped ? `（跳过草稿 ${skipped} 个）` : '') +
    (highlighted || degraded ? `（代码块高亮 ${highlighted}，降级 ${degraded}）` : ''),
)
