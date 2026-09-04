import type { HotPost, Post, PostNeighbor, RecentComment, TagName } from '@/types'
import { generatedPosts } from './posts.generated'

/**
 * 文章数据源
 *
 * 数据不再手写在本文件 —— 在 articles/ 目录新建 .md 文章
 * （frontmatter + markdown 正文），构建时自动编译为 posts.generated.ts。
 * 发文流程见 articles/README.md。
 *
 * 后续接后端 / CMS 时，只需替换本文件的导出，上层组件与组合式函数无需改动。
 *
 * 注意：publishedAt 存 ISO 日期，相对时间（"1天前"）由 formatRelativeTime
 * 在运行时计算 —— 避免硬编码的相对时间随时间推移而失真。
 */

export const posts: readonly Post[] = generatedPosts

/**
 * 按发布时间倒序（新 → 旧）。
 * 数据源无需手工维护顺序，避免新增文章时忘记插入位置。
 */
export const sortedPosts: readonly Post[] = [...posts].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
)

/** 轮播展示的精选文章 */
export const featuredPosts: readonly Post[] = sortedPosts.filter((post) => post.featured === true)

/** 侧栏热门文章：按阅读量取前 4 */
export const hotPosts: readonly HotPost[] = [...sortedPosts]
  .sort((a, b) => b.views - a.views)
  .slice(0, 4)
  .map(({ slug, title }) => ({ slug, title }))

/** 侧栏标签云：按出现次数降序去重 */
export const tagCloud: readonly TagName[] = [...new Set(posts.flatMap((post) => post.tags))].sort(
  (a, b) => {
    const countA = posts.filter((post) => post.tags.includes(a)).length
    const countB = posts.filter((post) => post.tags.includes(b)).length
    return countB - countA
  },
)

export const recentComments: readonly RecentComment[] = [
  { id: 'c1', author: '阿豪', content: 'Rolldown 迁移这篇太顶了，构建速度肉眼可见地快' },
  { id: 'c2', author: 'Nina', content: '夜间模式那篇收藏了，令牌方案学到了' },
  { id: 'c3', author: '老王', content: 'scrollBehavior 的坑我也踩过，看到过渡动画那段泪目' },
  { id: 'c4', author: '小鱼', content: '从开张篇追到现在，二十篇了，respect' },
  { id: 'c5', author: 'Tony', content: '友链已加，常来串门' },
]

/** 按 slug 查找文章。返回 undefined 而非抛错，由调用方决定 404 处理。 */
export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}

/** 拼接正文纯文本（阅读时长、摘要派生等场景使用） */
export function postPlainText(post: Post): string {
  return post.body.map((block) => ('text' in block ? block.text : '')).join(' ')
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
