/**
 * Studio CMS 数据层 —— articles/*.md 是唯一数据源
 *
 * 设计原则：
 *   - 所有状态都编码在 frontmatter 里，与博客构建管线（build-posts.mjs）
 *     完全兼容：管线只认 status=published（缺省视为 published，旧文零迁移）
 *   - 回收站与操作日志是本地运营数据，放 .studio/（已 gitignore），不入仓库
 *   - 每个可追溯动作都写日志（jsonl 追加，永不覆写）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, renameSync, unlinkSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '../lib/markdown.mjs'
import { stringifyFrontmatter } from '../lib/frontmatter.mjs'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const articlesDir = join(root, 'articles')
const stateDir = join(root, '.studio')
const trashDir = join(stateDir, 'trash')
const logsPath = join(stateDir, 'logs.jsonl')
const authorsPath = join(stateDir, 'authors.json')
const siteConfigPath = join(root, 'content', 'site.json')

export const ROOT = root
export const ARTICLES_DIR = articlesDir

/* ---------------- 状态机与权限 ---------------- */

export const STATUSES = ['draft', 'review', 'published', 'offline']
export const STATUS_LABELS = { draft: '草稿', review: '审核中', published: '已发布', offline: '已下线' }
export const ROLES = ['admin', 'editor', 'author']

/** 推荐位上限：满员后再推荐直接拒绝（前台推荐阅读/轮播共用该配额） */
export const MAX_FEATURED = 10
export const ROLE_LABELS = { admin: '管理员', editor: '编辑', author: '作者' }

/** 状态流转白名单：from → 允许的 to */
const TRANSITIONS = {
  draft: ['review', 'published', 'offline'],
  review: ['published', 'draft', 'offline'],
  published: ['offline', 'draft'],
  offline: ['published', 'draft'],
}

/**
 * 权限矩阵：role → 允许的动作。
 * guest（不在作者名单里）只读。
 * article 级约束（作者只能改自己的）在具体操作里二次校验。
 */
const PERMISSIONS = {
  admin: ['*'],
  editor: [
    'article:create', 'article:update', 'article:status', 'article:flags',
    'article:delete', 'trash:restore', 'batch', 'taxonomy:rename',
    'sync', 'logs:read', 'authors:read',
  ],
  author: ['article:create', 'article:update:own', 'article:submit'],
}

export function can(role, action) {
  if (role === 'admin') return true
  const perms = PERMISSIONS[role] ?? []
  return perms.includes(action)
}

/** 作者级二次校验：author 角色只能动自己的文章，且动作受限 */
export function canTouchArticle(role, action, article, actor) {
  if (role === 'admin' || role === 'editor') return { ok: true }
  if (role !== 'author') return { ok: false, reason: '只读身份，无权修改' }
  if (article.author !== actor) return { ok: false, reason: '作者只能编辑自己的文章' }
  if (action === 'update') return { ok: true }
  if (action === 'submit') {
    return ['draft'].includes(article.status)
      ? { ok: true }
      : { ok: false, reason: '只能提交草稿进入审核' }
  }
  return { ok: false, reason: `作者角色无权执行「${action}」` }
}

/* ---------------- 基础文件操作 ---------------- */

const isArticleFile = (name) => /^[\w.-]+\.md$/.test(name) && name !== 'README.md' && !name.startsWith('_')
const articlePath = (file) => join(articlesDir, file)

function ensureDirs() {
  mkdirSync(stateDir, { recursive: true })
  mkdirSync(trashDir, { recursive: true })
  if (!existsSync(authorsPath)) {
    writeFileSync(
      authorsPath,
      JSON.stringify(
        [
          { name: '周周', role: 'admin' },
          { name: '编辑甲', role: 'editor' },
          { name: '作者乙', role: 'author' },
        ],
        null,
        2,
      ),
      'utf8',
    )
  }
}

/* ---------------- 操作日志 ---------------- */

export function log(actor, action, target, detail = '') {
  const entry = { ts: new Date().toISOString(), actor, action, target, detail }
  appendFileSync(logsPath, JSON.stringify(entry) + '\n', 'utf8')
}

export function readLogs(limit = 200) {
  if (!existsSync(logsPath)) return []
  const lines = readFileSync(logsPath, 'utf8').trim().split('\n').filter(Boolean)
  return lines
    .slice(-limit)
    .reverse()
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return { ts: '', actor: '?', action: 'corrupted', target: '', detail: line }
      }
    })
}

/* ---------------- 作者 ---------------- */

export function listAuthors() {
  ensureDirs()
  try {
    const authors = JSON.parse(readFileSync(authorsPath, 'utf8'))
    return Array.isArray(authors) ? authors : []
  } catch {
    return []
  }
}

export function saveAuthors(authors) {
  ensureDirs()
  writeFileSync(authorsPath, JSON.stringify(authors, null, 2), 'utf8')
}

/* ---------------- 站点设置（content/site.json） ---------------- */

/** 允许后台编辑的站点字段白名单；其余（domain/logo/导航/giscus）仍归代码管 */
/* ---------------- 站点设置 ---------------- */

export const SITE_TEXT_FIELDS = ['name', 'fullName', 'tagline', 'description', 'author', 'since', 'email', 'icp', 'icpUrl', 'about', 'footerDesc']

/** 导航菜单可选类型与页面路由白名单（route kind 的 target 必须是其中之一） */
export const NAV_KINDS = ['route', 'external', 'disabled', 'hidden']
export const NAV_ROUTES = ['home', 'archive', 'tags', 'about', 'random']

function normalizeNavList(list, name) {
  if (!Array.isArray(list)) throw new Error(name + '格式错误：应为数组')
  if (list.length > 20) throw new Error(name + '最多 20 项')
  return list.map((item, i) => {
    const label = String(item.label ?? '').trim()
    const kind = String(item.kind ?? 'disabled')
    const target = String(item.target ?? '').trim()
    if (!label) throw new Error(`${name}第 ${i + 1} 项名称不能为空`)
    if (!NAV_KINDS.includes(kind)) throw new Error(`${name}「${label}」类型非法`)
    if (kind === 'route' && !NAV_ROUTES.includes(target)) {
      throw new Error(`${name}「${label}」的页面必须是：${NAV_ROUTES.join(' / ')} 之一`)
    }
    if (kind === 'external' && !/^(https?:\/\/|\/)/.test(target)) {
      throw new Error(`${name}「${label}」的链接必须以 http(s):// 或 / 开头`)
    }
    return {
      label,
      icon: String(item.icon ?? '').trim(),
      kind,
      target: kind === 'disabled' || kind === 'hidden' ? '' : target,
      showOnMobile: item.showOnMobile !== false,
    }
  })
}

export function readSiteConfig() {
  return JSON.parse(readFileSync(siteConfigPath, 'utf8'))
}

/** 保存站点设置：字段白名单过滤 + 友链结构校验，返回保存后的完整配置 */
export function saveSiteConfig(input) {
  const current = readSiteConfig()
  const next = { ...current, site: { ...current.site } }

  for (const key of SITE_TEXT_FIELDS) {
    if (input[key] !== undefined) next.site[key] = input[key]
  }

  if (input.friendLinks !== undefined) {
    if (!Array.isArray(input.friendLinks)) throw new Error('友链格式错误：应为数组')
    next.friendLinks = input.friendLinks.map((l, i) => {
      const label = String(l.label ?? '').trim()
      const href = String(l.href ?? '').trim()
      if (!label) throw new Error(`第 ${i + 1} 条友链名称不能为空`)
      if (!/^https?:\/\//.test(href)) throw new Error(`友链「${label}」的地址必须以 http(s):// 开头`)
      return { label, href }
    })
  }

  if (input.mainNav !== undefined) next.mainNav = normalizeNavList(input.mainNav, '顶部导航')
  if (input.mobileExtraNav !== undefined) next.mobileExtraNav = normalizeNavList(input.mobileExtraNav, 'H5 抽屉入口')

  writeFileSync(siteConfigPath, JSON.stringify(next, null, 2) + '\n', 'utf8')
  return next
}

export function roleOf(actor) {
  if (!actor) return 'guest'
  const hit = listAuthors().find((a) => a.name === actor)
  return hit ? hit.role : 'guest'
}

/* ---------------- 文章读写 ---------------- */

const DEFAULT_STATUS = 'published' // 旧文无 status 字段 → 视为已发布（零迁移兼容）

export function normalizeArticle(data, body, file) {
  return {
    file,
    slug: String(data.slug ?? ''),
    title: String(data.title ?? ''),
    excerpt: String(data.excerpt ?? ''),
    publishedAt: String(data.publishedAt ?? ''),
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: String(data.category ?? ''),
    author: String(data.author ?? ''),
    status: STATUSES.includes(data.status) ? data.status : DEFAULT_STATUS,
    pinned: data.pinned === true || data.pinned === 'true',
    featured: data.featured === true || data.featured === 'true',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    seoDescription: String(data.seoDescription ?? ''),
    publishAt: String(data.publishAt ?? ''),
    offlineAt: String(data.offlineAt ?? ''),
    views: Number(data.views ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    cover: String(data.cover ?? ''),
    hasCover: Boolean(data.cover),
    body: body ?? '',
  }
}

/**
 * 列出全部文章（含未发布的）；不读正文 body，列表轻量。
 * 性能：带 1.5 秒 TTL 缓存 + 写操作主动失效。一次页面导航会触发
 * meta(statusCounts+taxonomy) + articles 多次全量读取，不缓存会反复扫盘解析。
 */
let articleCache = { at: 0, items: null }
const ARTICLE_CACHE_TTL = 1500

export function invalidateArticleCache() {
  articleCache = { at: 0, items: null }
}

export function listArticles() {
  if (articleCache.items && Date.now() - articleCache.at < ARTICLE_CACHE_TTL) {
    return articleCache.items
  }
  const items = existsSync(articlesDir)
    ? readdirSync(articlesDir)
        .filter(isArticleFile)
        .map((file) => {
          try {
            const { data } = parseFrontmatter(readFileSync(articlePath(file), 'utf8'))
            return normalizeArticle(data, '', file)
          } catch {
            return normalizeArticle({ title: file, slug: '' }, '', file)
          }
        })
    : []
  articleCache = { at: Date.now(), items }
  return items
}

export function getArticle(file) {
  if (!isArticleFile(file)) return null
  const p = articlePath(file)
  if (!existsSync(p)) return null
  const { data, body } = parseFrontmatter(readFileSync(p, 'utf8'))
  return normalizeArticle(data, body, file)
}

function writeArticleFile(file, data, body) {
  writeFileSync(articlePath(file), stringifyFrontmatter(data, body), 'utf8')
}

/** 按 frontmatter 顺序约定整理字段（可读性 + diff 稳定） */
function orderedData(a) {
  const out = {}
  out.slug = a.slug
  out.title = a.title
  if (a.excerpt) out.excerpt = a.excerpt
  if (a.publishedAt) out.publishedAt = a.publishedAt
  if (a.tags?.length) out.tags = a.tags
  if (a.category) out.category = a.category
  if (a.author) out.author = a.author
  // status 必须显式落盘：省略会导致「draft→published」写回时旧值复活
  out.status = a.status || DEFAULT_STATUS
  if (a.pinned) out.pinned = true
  if (a.featured) out.featured = true
  if (a.keywords?.length) out.keywords = a.keywords
  if (a.seoDescription) out.seoDescription = a.seoDescription
  if (a.publishAt) out.publishAt = a.publishAt
  if (a.offlineAt) out.offlineAt = a.offlineAt
  if (a.cover) out.cover = a.cover
  out.views = a.views ?? 0
  out.commentCount = a.commentCount ?? 0
  return out
}

export function slugExistsIn(slug, exceptFile = '') {
  return listArticles().some((a) => a.slug === slug && a.file !== exceptFile)
}

/** 留空自动出号：时间戳+两位随机尾数，纯数字；撞车重抽，保证唯一 */
function uniqueNumericSlug() {
  let s
  do {
    s = String(Date.now()) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  } while (slugExistsIn(s))
  return s
}

/** 当前推荐文章数（全站） */
export function featuredCount() {
  return listArticles().filter((a) => a.featured).length
}

/** 推荐位满员拦截：只在「未推荐 → 推荐」跃迁时校验，已推荐文章保存不受影响 */
function assertFeaturedSlot(willFeature, alreadyFeatured) {
  if (willFeature && !alreadyFeatured && featuredCount() >= MAX_FEATURED) {
    throw new Error(`推荐位已满（最多 ${MAX_FEATURED} 篇），请先取消其他文章的推荐再试`)
  }
}

/** 创建：返回 { file } 或抛错（中文错误消息直接给前端） */
export function createArticle(input) {
  const slug = String(input.slug || '').trim() || uniqueNumericSlug() // 留空自动分配随机编号
  const title = String(input.title || '').trim()
  if (!title) throw new Error('标题不能为空')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`slug 不合法：${slug}`)
  if (slugExistsIn(slug)) throw new Error(`slug "${slug}" 已被使用`)

  const article = {
    slug,
    title,
    excerpt: String(input.excerpt ?? '').trim(),
    publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt ?? '')
      ? input.publishedAt
      : new Date().toISOString().slice(0, 10),
    tags: Array.isArray(input.tags) ? input.tags : [],
    category: String(input.category ?? '').trim(),
    author: String(input.author ?? '').trim(),
    status: STATUSES.includes(input.status) ? input.status : 'draft',
    pinned: Boolean(input.pinned),
    featured: Boolean(input.featured),
    keywords: Array.isArray(input.keywords) ? input.keywords : [],
    seoDescription: String(input.seoDescription ?? '').trim(),
    publishAt: String(input.publishAt ?? '').trim(),
    offlineAt: String(input.offlineAt ?? '').trim(),
    cover: String(input.cover ?? '').trim(),
    views: 0,
    commentCount: 0,
  }
  if (!article.excerpt) article.excerpt = '（待补摘要）'
  if (!article.author) article.author = '未知'
  assertFeaturedSlot(article.featured, false)

  const body = String(input.content ?? '').replace(/\r\n/g, '\n').trim()
  if (!body) throw new Error('正文不能为空')

  const file = `${article.publishedAt}-${slug}.md`
  writeArticleFile(file, orderedData(article), body)
  invalidateArticleCache()
  return { file }
}

/** 更新：字段级合并；slug/日期变更时自动改文件名 */
export function updateArticle(file, input) {
  const old = getArticle(file)
  if (!old) throw new Error('文章不存在')

  // 状态变更必须走流转白名单，防止编辑器保存绕过状态机
  if (input.status !== undefined && input.status !== old.status) {
    if (!STATUSES.includes(input.status)) throw new Error(`未知状态：${input.status}`)
    if (!TRANSITIONS[old.status]?.includes(input.status)) {
      throw new Error(`不允许从「${STATUS_LABELS[old.status]}」变更为「${STATUS_LABELS[input.status]}」`)
    }
  }

  const merged = { ...old, ...pickEditable(input) }
  if (input.title !== undefined) {
    const t = String(input.title).trim()
    if (!t) throw new Error('标题不能为空')
    merged.title = t
  }
  if (input.slug !== undefined) {
    const s = String(input.slug).trim() || uniqueNumericSlug() // 清空 slug 视同重新自动分配
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) throw new Error(`slug 不合法：${s}`)
    if (slugExistsIn(s, file)) throw new Error(`slug "${s}" 已被使用`)
    merged.slug = s
  }
  if (input.publishedAt !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) throw new Error('日期格式必须为 YYYY-MM-DD')
    merged.publishedAt = input.publishedAt
  }
  if (input.content !== undefined) {
    const body = String(input.content).replace(/\r\n/g, '\n').trim()
    if (!body) throw new Error('正文不能为空')
    merged._body = body
  }
  merged._body ??= old.body
  assertFeaturedSlot(merged.featured === true, old.featured === true)

  const newFile = `${merged.publishedAt}-${merged.slug}.md`
  writeArticleFile(newFile, orderedData(merged), merged._body)
  if (newFile !== file) unlinkSync(articlePath(file))
  return { file: newFile, renamed: newFile !== file }
}

function pickEditable(input) {
  const keys = [
    'excerpt', 'tags', 'category', 'author', 'status', 'pinned', 'featured',
    'keywords', 'seoDescription', 'publishAt', 'offlineAt', 'cover',
  ]
  const out = {}
  for (const k of keys) if (input[k] !== undefined) out[k] = input[k]
  return out
}

/** 状态流转（带白名单校验） */
export function changeStatus(file, to, _actor) {
  const article = getArticle(file)
  if (!article) throw new Error('文章不存在')
  if (!STATUSES.includes(to)) throw new Error(`未知状态：${to}`)
  if (to === article.status) return { file, from: to, to, noop: true } // 批量操作里目标=现状属正常，不算失败
  if (!TRANSITIONS[article.status]?.includes(to)) {
    throw new Error(`不允许从「${STATUS_LABELS[article.status]}」变更为「${STATUS_LABELS[to]}」`)
  }
  const data = { status: to }
  if (to === 'published') {
    data.publishAt = '' // 已正式发布，清掉定时
    data.offlineAt = '' // 重新上线必须清掉过期 offlineAt，否则调度器 30 秒内又把文章踢回 offline
    if (!article.publishedAt) data.publishedAt = new Date().toISOString().slice(0, 10)
  }
  const p = articlePath(file)
  const { data: raw, body } = parseFrontmatter(readFileSync(p, 'utf8'))
  const merged = { ...raw, ...orderedData({ ...article, ...data }) }
  // 显式清空的字段必须从 raw 合并结果里删掉，否则旧值复活
  if (data.publishAt === '') delete merged.publishAt
  if (data.offlineAt === '') delete merged.offlineAt
  writeArticleFile(file, merged, body)
  invalidateArticleCache()
  return { file, from: article.status, to }
}

/** 置顶 / 推荐 开关 */
export function setFlags(file, { pinned, featured }) {
  const article = getArticle(file)
  if (!article) throw new Error('文章不存在')
  const p = articlePath(file)
  const { data: raw, body } = parseFrontmatter(readFileSync(p, 'utf8'))
  const next = { ...article }
  if (pinned !== undefined) next.pinned = Boolean(pinned)
  if (featured !== undefined) next.featured = Boolean(featured)
  assertFeaturedSlot(next.featured === true, article.featured === true)
  // orderedData 对 false 值省略字段，必须从 raw 里删掉，否则旧值复活（取消置顶失效）
  const merged = { ...raw, ...orderedData(next) }
  if (!next.pinned) delete merged.pinned
  if (!next.featured) delete merged.featured
  writeArticleFile(file, merged, body)
  invalidateArticleCache()
  return { file, pinned: next.pinned, featured: next.featured }
}

/* ---------------- 回收站 ---------------- */

function trashMetaPath() {
  return join(trashDir, 'meta.json')
}

function readTrashMeta() {
  try {
    return JSON.parse(readFileSync(trashMetaPath(), 'utf8'))
  } catch {
    return {}
  }
}

function writeTrashMeta(meta) {
  writeFileSync(trashMetaPath(), JSON.stringify(meta, null, 2), 'utf8')
}

export function trashArticle(file, actor) {
  const article = getArticle(file)
  if (!article) throw new Error('文章不存在')
  ensureDirs()
  const meta = readTrashMeta()
  const ts = Date.now()
  const trashName = `${ts}-${file}`
  renameSync(articlePath(file), join(trashDir, trashName))
  invalidateArticleCache()
  meta[trashName] = {
    originalFile: file,
    title: article.title,
    slug: article.slug,
    status: article.status,
    author: article.author,
    deletedAt: new Date().toISOString(),
    deletedBy: actor,
  }
  writeTrashMeta(meta)
  return { trashName, title: article.title }
}

export function listTrash() {
  ensureDirs()
  const meta = readTrashMeta()
  return readdirSync(trashDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const m = meta[f] ?? {}
      let size = 0
      try {
        size = statSync(join(trashDir, f)).size
      } catch { /* 忽略 */ }
      return {
        trashName: f,
        originalFile: m.originalFile ?? f.replace(/^\d+-/, ''),
        title: m.title ?? f,
        slug: m.slug ?? '',
        status: m.status ?? '',
        deletedAt: m.deletedAt ?? '',
        deletedBy: m.deletedBy ?? '',
        size,
      }
    })
    .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1))
}

export function restoreFromTrash(trashName, _actor) {
  const meta = readTrashMeta()
  const info = meta[trashName]
  const src = join(trashDir, trashName)
  if (!info || !existsSync(src)) throw new Error('回收站里没有这个文件')

  // 目标名冲突时追加序号，绝不覆盖
  let target = `articles/${info.originalFile}`
  let seq = 2
  const base = info.originalFile.replace(/\.md$/, '')
  while (existsSync(join(root, target))) {
    target = `articles/${base}-restored${seq++}.md`
  }
  const fileName = target.replace('articles/', '')
  renameSync(src, join(articlesDir, fileName))
  delete meta[trashName]
  writeTrashMeta(meta)
  invalidateArticleCache()
  // slug 已被现存文章占用时提醒（文件能恢复，但线上会出现 slug 冲突，编辑时需改名）
  return { file: fileName, slugConflict: slugExistsIn(info.slug, fileName) }
}

export function purgeTrash(trashName) {
  const meta = readTrashMeta()
  const src = join(trashDir, trashName)
  if (!existsSync(src)) throw new Error('回收站里没有这个文件')
  unlinkSync(src)
  delete meta[trashName]
  writeTrashMeta(meta)
  invalidateArticleCache()
  return { purged: trashName }
}

/* ---------------- 分类与标签（taxonomy） ---------------- */

export function taxonomy() {
  const articles = listArticles()
  const count = (key) => {
    const map = {}
    for (const a of articles) {
      const values = key === 'category' ? [a.category] : a.tags
      for (const v of values) {
        if (!v) continue
        map[v] = (map[v] ?? 0) + 1
      }
    }
    return Object.entries(map)
      .map(([name, n]) => ({ name, count: n }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }
  return { categories: count('category'), tags: count('tag') }
}

/** 全站重命名分类/标签：重写所有命中文章的 frontmatter */
export function renameTaxonomy(type, from, to) {
  if (!['category', 'tag'].includes(type)) throw new Error('type 必须是 category 或 tag')
  const fromClean = String(from).trim()
  const toClean = String(to).trim()
  if (!fromClean || !toClean) throw new Error('名称不能为空')
  if (fromClean === toClean) throw new Error('新旧名称相同')

  const changed = []
  for (const file of readdirSync(articlesDir).filter(isArticleFile)) {
    const p = articlePath(file)
    const { data, body } = parseFrontmatter(readFileSync(p, 'utf8'))
    if (type === 'category') {
      if (data.category !== fromClean) continue
      data.category = toClean
    } else {
      if (!Array.isArray(data.tags) || !data.tags.includes(fromClean)) continue
      data.tags = data.tags.map((t) => (t === fromClean ? toClean : t))
    }
    writeArticleFile(file, data, body)
    changed.push(file)
  }
  if (!changed.length) throw new Error(`没有文章使用「${fromClean}」`)
  invalidateArticleCache()
  return { changed }
}

/* ---------------- 搜索 / 筛选 / 排序 ---------------- */

export function queryArticles({ status, q, category, tag, author, sort }) {
  let items = listArticles()
  if (status && STATUSES.includes(status)) items = items.filter((a) => a.status === status)
  if (category) items = items.filter((a) => a.category === category)
  if (tag) items = items.filter((a) => a.tags.includes(tag))
  if (author) items = items.filter((a) => a.author === author)
  if (q) {
    const kw = q.toLowerCase()
    items = items.filter((a) =>
      [a.title, a.excerpt, a.slug, a.category, ...a.tags, ...a.keywords]
        .join(' ')
        .toLowerCase()
        .includes(kw),
    )
  }
  const byDate = (a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)
  if (sort === 'oldest') items.sort((a, b) => -byDate(a, b))
  else items.sort(byDate)
  // 置顶永远在最前（仅列表展示层排序，不影响线上 sortedPosts 之外逻辑）
  items.sort((a, b) => Number(b.pinned) - Number(a.pinned))
  return items
}

export function statusCounts() {
  const counts = { all: 0, draft: 0, review: 0, published: 0, offline: 0 }
  for (const a of listArticles()) {
    counts.all++
    counts[a.status]++
  }
  return counts
}

/* ---------------- 定时上下线调度 ---------------- */

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/

/**
 * 扫一遍定时任务：
 *   - publishAt 已到 且 状态是 draft/review → 翻成 published
 *   - offlineAt 已到 且 状态是 published → 翻成 offline
 * 返回被翻转的文件列表（调用方负责触发推送同步）。
 */
export function runSchedule() {
  const now = Date.now()
  const flipped = []
  for (const file of readdirSync(articlesDir).filter(isArticleFile)) {
    const a = getArticle(file)
    if (!a) continue
    try {
      if (a.publishAt && DATETIME_RE.test(a.publishAt) && ['draft', 'review'].includes(a.status)) {
        if (new Date(a.publishAt.replace(' ', 'T')).getTime() <= now) {
          changeStatus(file, 'published', 'scheduler')
          log('scheduler', 'schedule:publish', file, `定时发布生效（publishAt=${a.publishAt}）`)
          flipped.push({ file, kind: 'publish' })
        }
      }
      if (a.offlineAt && DATETIME_RE.test(a.offlineAt) && a.status === 'published') {
        if (new Date(a.offlineAt.replace(' ', 'T')).getTime() <= now) {
          changeStatus(file, 'offline', 'scheduler')
          log('scheduler', 'schedule:offline', file, `定时下线生效（offlineAt=${a.offlineAt}）`)
          flipped.push({ file, kind: 'offline' })
        }
      }
    } catch (err) {
      log('scheduler', 'schedule:error', file, String(err.message || err))
    }
  }
  return flipped
}

// 模块加载即初始化目录
ensureDirs()
