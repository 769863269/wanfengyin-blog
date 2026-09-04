/**
 * 构建时把 articles/*.md 编译为 src/data/posts.generated.ts
 *
 * 发文流程：在 articles/ 新建一个 .md（frontmatter + markdown 正文）→ 完成。
 * 数据校验在此集中做：缺字段、slug 重复、日期非法直接报错退出，
 * 不让坏数据流进构建。
 *
 * 由 npm predev / prebuild 自动触发，也可手动 `npm run posts`。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, markdownToBlocks } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const articlesDir = join(root, 'articles')
const outputFile = join(root, 'src', 'data', 'posts.generated.ts')

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const REQUIRED = ['slug', 'title', 'excerpt', 'publishedAt', 'tags']

function fail(file, message) {
  console.error(`[posts] ${file}: ${message}`)
  process.exit(1)
}

// README.md 与 _ 开头文件是文档，不是文章
const isArticle = (name) => name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_')
const files = readdirSync(articlesDir).filter(isArticle).sort()

if (!files.length) {
  fail(articlesDir, '没有找到任何 .md 文章')
}

const posts = []
const seenSlugs = new Set()

for (const file of files) {
  const raw = readFileSync(join(articlesDir, file), 'utf8')
  const { data, body } = parseFrontmatter(raw)

  for (const field of REQUIRED) {
    if (!data[field]) fail(file, `frontmatter 缺少必填字段 "${field}"`)
  }
  if (seenSlugs.has(data.slug)) fail(file, `slug "${data.slug}" 重复`)
  if (!ISO_DATE.test(data.publishedAt)) fail(file, `publishedAt 必须是 YYYY-MM-DD 格式`)

  const body_ = body || (fail(file, '正文不能为空'), '')
  const tags = Array.isArray(data.tags)
    ? data.tags
    : String(data.tags)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
  if (!tags.length) fail(file, 'tags 不能为空')

  seenSlugs.add(data.slug)
  posts.push({
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    cover: data.cover ?? '',
    publishedAt: data.publishedAt,
    views: Number(data.views ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    tags,
    featured: data.featured === true || data.featured === 'true',
    body: markdownToBlocks(body_),
  })
}

// 构建期 Shiki 高亮：为每个代码块生成 codeHtml（失败自动降级纯文本）
let highlighted = 0
let degraded = 0
for (const post of posts) {
  for (const block of post.body) {
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

// 按时间倒序输出，读起来直观；运行时排序逻辑依然独立存在
posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

const banner = `/**
 * ⚠️ 本文件由 scripts/build-posts.mjs 自动生成，请勿手工编辑。
 *
 * 数据源：articles/*.md
 * 重新生成：npm run posts（dev / build 前自动执行）
 */
import type { Post } from '@/types'

export const generatedPosts: Post[] = `

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(outputFile, banner + JSON.stringify(posts, null, 2) + '\n', 'utf8')

console.log(
  `[posts] ${posts.length} 篇文章编译完成 → src/data/posts.generated.ts` +
    (highlighted || degraded ? `（代码块高亮 ${highlighted}，降级 ${degraded}）` : ''),
)
