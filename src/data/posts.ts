import { computed } from 'vue'
import type { ArticleBlock, HotPost, PostNeighbor, PostSummary, TagName } from '@/types'
import { generatedPosts } from './posts.generated'
// 注意：本文件被 vite.config.ts（sitemap 插件）在 Node 侧引用，
// 必须用相对路径导入——vite 打包 config 自身时不解析 @/ 别名
import { lastReadAt, localViews } from '../utils/viewStats'

/**
 * 文章数据源（元数据）
 *
 * 数据不再手写在本文件 —— 在 articles/ 目录新建 .md 文章
 * （frontmatter + markdown 正文），构建时自动编译为 posts.generated.ts。
 * 发文流程见 articles/README.md。
 *
 * 正文不在这里：它被拆到 posts.body.generated.ts，经 loadPostBody() 按需加载。
 * 正文占全部文章数据的 97%，只有详情页用得上，放首屏等于让每个访客先下载全文。
 *
 * 注意：publishedAt 存 ISO 日期，相对时间（"1天前"）由 formatRelativeTime
 * 在运行时计算 —— 避免硬编码的相对时间随时间推移而失真。
 */

export const posts: readonly PostSummary[] = generatedPosts

/**
 * 按发布时间倒序（新 → 旧），置顶文章（Studio CMS 的 pinned）排最前。
 * 数据源无需手工维护顺序，避免新增文章时忘记插入位置。
 */
export const sortedPosts: readonly PostSummary[] = [...posts]
  .sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    // 发布时间精确到分钟（publishedTime），同日内新发的排前面
    const ts = (p: PostSummary) => new Date(`${p.publishedAt}T${p.publishedTime || '00:00'}`).getTime()
    return ts(b) - ts(a)
  })

/** 轮播展示的精选文章（Studio CMS 的 featured）。无封面的走渐变兜底，侧栏「推荐阅读」消费；上限 10 篇与后台配额一致 */
export const featuredPosts: readonly PostSummary[] = sortedPosts
  .filter((post) => post.featured === true)
  .slice(0, 10)

/**
 * 首页轮播：自动筛选带封面的文章，最多 5 篇滚动。
 * 排序规则：站长推荐（featured）优先霸位，其余按「置顶 → 时间新→旧」补位。
 * 没封面的不进轮播（背景没图只剩渐变底，观感差），但仍在侧栏推荐位露出。
 */
export const carouselPosts: readonly PostSummary[] = [
  ...sortedPosts.filter((post) => post.featured === true && post.cover !== ''),
  ...sortedPosts.filter((post) => post.featured !== true && post.cover !== ''),
].slice(0, 5)

/**
 * 侧栏热门文章：本机真实阅读驱动，不是固定榜单。
 * 规则：读过的文章按阅读次数降序霸榜（看一篇涨一篇，实时重排）；同次数按最近读的优先；
 * 不足 4 篇用「置顶 → 时间新→旧」补位，保证面板不空。
 * 不再按 frontmatter 演示基数排序——基数只用于展示，不参与排名。
 */
export const hotPosts = computed<readonly HotPost[]>(() => {
  const read = [...posts]
    .filter((post) => localViews(post.slug) > 0)
    .sort((a, b) => localViews(b.slug) - localViews(a.slug) || lastReadAt(b.slug) - lastReadAt(a.slug))
    .slice(0, 4)
  const rest = sortedPosts.filter((post) => !read.some((r) => r.slug === post.slug))
  return [...read, ...rest].slice(0, 4).map(({ slug, title }) => ({ slug, title }))
})

/** 侧栏标签云：按出现次数降序去重 */
export const tagCloud: readonly TagName[] = [...new Set(posts.flatMap((post) => post.tags))].sort(
  (a, b) => {
    const countA = posts.filter((post) => post.tags.includes(a)).length
    const countB = posts.filter((post) => post.tags.includes(b)).length
    return countB - countA
  },
)

/** 分类聚合（Studio CMS 维护的分类字段）：名称 + 文章数，按热度降序 */
export const categoryCloud: readonly { name: string; count: number }[] = (() => {
  const counts = new Map<string, number>()
  for (const post of posts) {
    if (!post.category) continue
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})()

/** 按 slug 查找文章元数据。返回 undefined 而非抛错，由调用方决定 404 处理。 */
export function findPost(slug: string): PostSummary | undefined {
  return posts.find((post) => post.slug === slug)
}

/** 取上一篇 / 下一篇（按时间倒序，即「上一篇」是更新的那篇） */
export function getNeighbors(slug: string): {
  prev: PostNeighbor | undefined
  next: PostNeighbor | undefined
} {
  const index = sortedPosts.findIndex((post) => post.slug === slug)
  if (index === -1) return { prev: undefined, next: undefined }

  const newer = sortedPosts[index - 1]
  const older = sortedPosts[index + 1]

  return {
    prev: newer ? { slug: newer.slug, title: newer.title } : undefined,
    next: older ? { slug: older.slug, title: older.title } : undefined,
  }
}

/* ===================== 正文按需加载 ===================== */

type BodyMap = Record<string, ArticleBlock[]>

/** 单例 Promise：并发调用只触发一次网络请求 */
let bodiesPromise: Promise<BodyMap> | undefined

/**
 * 加载全部文章正文（搜索结果里要搜正文，需要一次拿全）。
 * 动态 import → Vite 独立分包，不进首屏。
 */
export function loadPostBodies(): Promise<BodyMap> {
  bodiesPromise ??= import('./posts.body.generated').then((mod) => mod.generatedBodies)
  return bodiesPromise
}

/** 加载单篇正文（文章详情页用） */
export async function loadPostBody(slug: string): Promise<ArticleBlock[] | undefined> {
  const bodies = await loadPostBodies()
  return bodies[slug]
}
