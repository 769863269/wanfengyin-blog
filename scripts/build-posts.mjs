/**
 * 构建时把 articles/*.md 编译为两份前端数据
 *
 *   src/data/posts.generated.ts       文章元数据（PostSummary[]）—— 首屏需要的部分
 *   src/data/posts.body.generated.ts  正文块（slug → ArticleBlock[]）—— 按需动态加载
 *
 * 为什么拆两份：正文占数据总量的 97%，但只有文章详情页真正用得上。
 * 合成一份塞进首屏，等于每个访客先下载全部文章全文（实测首屏 chunk 372KB）。
 * 拆分后首屏只带元数据，正文进详情页才拉。
 *
 * 发文流程：在 articles/ 新建 .md（frontmatter + markdown 正文）→ 完成。
 * 解析与校验统一走 scripts/lib/articles.mjs（与 prerender.mjs 同一实现）。
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownToBlocks } from './lib/markdown.mjs'
import { highlightToCodeHtml } from './lib/highlight.mjs'
import {
  ArticleError,
  blocksPlainText,
  estimateReadingMinutes,
  readAllArticles,
} from './lib/articles.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const articlesDir = join(root, 'articles')
const dataDir = join(root, 'src', 'data')

const HEADER = `/**
 * ⚠️ 本文件由 scripts/build-posts.mjs 自动生成，请勿手工编辑。
 *
 * 数据源：articles/*.md
 * 重新生成：npm run posts（dev / build 前自动执行）
 */
`

let articles
let skipped
try {
  ;({ articles, skipped } = readAllArticles(articlesDir))
} catch (err) {
  if (err instanceof ArticleError) {
    console.error(`[posts] ${err.message}`)
    process.exit(1)
  }
  throw err
}

/** 元数据（不含正文）+ 构建期算好的阅读时长，供列表页直接用 */
const summaries = []
/** slug → 正文块，详情页按需加载 */
const bodies = {}
let highlighted = 0
let degraded = 0

for (const { meta, body } of articles) {
  const blocks = markdownToBlocks(body)

  // 构建期 Shiki 高亮：为每个代码块生成 codeHtml（失败自动降级纯文本）
  for (const block of blocks) {
    if (block.type !== 'code') continue
    const html = await highlightToCodeHtml(block.text, block.lang)
    if (html) {
      block.codeHtml = html
      highlighted++
    } else {
      degraded++
    }
  }

  summaries.push({ ...meta, readingMinutes: estimateReadingMinutes(blocksPlainText(blocks)) })
  bodies[meta.slug] = blocks
}

mkdirSync(dataDir, { recursive: true })

// 元数据文件保留缩进，便于 review 增删了哪些文章
writeFileSync(
  join(dataDir, 'posts.generated.ts'),
  `${HEADER}import type { PostSummary } from '@/types'

export const generatedPosts: PostSummary[] = ${JSON.stringify(summaries, null, 2)}
`,
  'utf8',
)

// 正文文件是纯载荷、不给人读：紧凑序列化，省掉缩进空白
writeFileSync(
  join(dataDir, 'posts.body.generated.ts'),
  `${HEADER}import type { ArticleBlock } from '@/types'

export const generatedBodies: Record<string, ArticleBlock[]> = ${JSON.stringify(bodies)}
`,
  'utf8',
)

console.log(
  `[posts] ${summaries.length} 篇文章编译完成 → posts.generated.ts（元数据）` +
    ` + posts.body.generated.ts（正文）` +
    (skipped ? `（跳过未发布 ${skipped} 篇）` : '') +
    (highlighted || degraded ? `（代码块高亮 ${highlighted}，降级 ${degraded}）` : ''),
)
