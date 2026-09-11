/**
 * 文章源统一读取层
 *
 * 两个消费方共用：
 *   1. scripts/build-posts.mjs —— 编译为前端数据（posts.generated.ts / posts.body.generated.ts）
 *   2. scripts/prerender.mjs   —— 渲染 SEO 预渲染静态页
 *
 * 为什么必须共用：这两条链原先各自解析一遍 articles/*.md，一处加了校验另一处忘了，
 * 就会出现「编译进站点的文章」与「预渲染给爬虫的页面」内容不一致——而且是静默的。
 * 所有 frontmatter 解析、必填校验、状态过滤、数据门禁统一收敛到本文件。
 *
 * 任一校验失败抛 ArticleError，由调用方决定怎么报（构建脚本捕获后打印并退出）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from './markdown.mjs'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const REQUIRED = ['slug', 'title', 'excerpt', 'publishedAt', 'tags']

/**
 * 单篇 .md 源文件体积上限。
 * 正常文章 2–5KB，64KB 已经极宽松；超过基本是误把图片 / 大段日志粘进了正文。
 */
export const MAX_ARTICLE_BYTES = 64 * 1024

/**
 * 正文内联 base64 图片检测。
 * data URI 会原样进入前端 bundle（且无法被浏览器单独缓存），一张 200KB 的图
 * 就能把首屏体积顶上去，属于必须拦死的写法。
 */
const INLINE_BASE64_RE = /\]\(\s*data:[a-z+./-]+;base64,|src\s*=\s*["']data:[a-z+./-]+;base64,/i

export class ArticleError extends Error {
  constructor(file, message) {
    super(`${file}: ${message}`)
    this.name = 'ArticleError'
    this.file = file
  }
}

/** 文章文件名（排除 README 与 _ 前缀的文档），按文件名升序 */
export function listArticleFiles(articlesDir) {
  return readdirSync(articlesDir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_'))
    .sort()
}

/**
 * 读取并校验单篇文章。
 *
 * 门禁分两档：
 *   - 体积 / 内联 base64 —— 对**所有**文章生效（含草稿：草稿同样进仓库，
 *     且将来一发布就把 base64 带进 bundle）
 *   - 必填字段 / 日期格式 / 标签 —— 只对**已发布**文章校验，
 *     写作中的草稿允许字段暂时不全
 */
export function readArticle(articlesDir, file) {
  const full = join(articlesDir, file)

  const bytes = statSync(full).size
  if (bytes > MAX_ARTICLE_BYTES) {
    throw new ArticleError(
      file,
      `源文件 ${(bytes / 1024).toFixed(0)}KB 超过上限 ${MAX_ARTICLE_BYTES / 1024}KB —— 检查是否把图片或大段日志粘进了正文`,
    )
  }

  const raw = readFileSync(full, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const status = data.status ?? 'published'

  if (INLINE_BASE64_RE.test(raw)) {
    throw new ArticleError(
      file,
      '正文含内联 base64 图片（data:…;base64,）—— 会被整段打进前端 bundle；请在后台用「上传图片」拿到文件地址再引用',
    )
  }

  const meta = {
    slug: String(data.slug ?? ''),
    title: String(data.title ?? ''),
    excerpt: String(data.excerpt ?? ''),
    cover: String(data.cover ?? ''),
    publishedTime: String(data.publishedTime ?? ''),
    publishedAt: String(data.publishedAt ?? ''),
    views: Number(data.views ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    tags: [],
    featured: data.featured === true || data.featured === 'true',
    pinned: data.pinned === true || data.pinned === 'true',
    category: String(data.category ?? ''),
    author: String(data.author ?? ''),
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    seoDescription: String(data.seoDescription ?? ''),
  }

  if (status !== 'published') {
    return { file, status, body, meta, skipped: true }
  }

  for (const field of REQUIRED) {
    if (!data[field]) throw new ArticleError(file, `frontmatter 缺少必填字段 "${field}"`)
  }
  if (!ISO_DATE.test(meta.publishedAt)) {
    throw new ArticleError(file, 'publishedAt 必须是 YYYY-MM-DD 格式')
  }
  if (!body || !body.trim()) throw new ArticleError(file, '正文不能为空')

  meta.tags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t).trim()).filter(Boolean)
    : String(data.tags)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
  if (!meta.tags.length) throw new ArticleError(file, 'tags 不能为空')

  return { file, status, body, meta, skipped: false }
}

/**
 * 读取全部已发布文章，按发布时间（含 HH:mm）倒序。
 * 返回 { articles, skipped }——skipped 是非发布状态被跳过的篇数。
 */
export function readAllArticles(articlesDir) {
  const files = listArticleFiles(articlesDir)
  if (!files.length) throw new ArticleError(articlesDir, '没有找到任何 .md 文章')

  const seen = new Set()
  const articles = []
  let skipped = 0

  for (const file of files) {
    const article = readArticle(articlesDir, file)
    if (article.skipped) {
      skipped++
      continue
    }
    if (seen.has(article.meta.slug)) {
      throw new ArticleError(file, `slug "${article.meta.slug}" 重复`)
    }
    seen.add(article.meta.slug)
    articles.push(article)
  }

  const ts = (a) => new Date(`${a.meta.publishedAt}T${a.meta.publishedTime || '00:00'}`).getTime()
  articles.sort((a, b) => ts(b) - ts(a))

  return { articles, skipped }
}

/** 正文块 → 纯文本（阅读时长、搜索索引用，与前端 blocksPlainText 同一语义） */
export function blocksPlainText(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'table') return [...block.head, ...block.rows.flat()].join(' ')
      if (block.type === 'list') {
        return block.items
          .map((item) => (typeof item === 'string' ? item : item.text))
          .join(' ')
      }
      return 'text' in block ? block.text : ''
    })
    .join(' ')
}

/** 估算阅读时长（中文按 350 字/分钟，与 src/utils/format.ts 保持一致） */
export function estimateReadingMinutes(text) {
  return Math.max(1, Math.round(text.trim().length / 350))
}
