import type { ArticleBlock, PostSummary } from '@/types'
import { blocksPlainText } from '@/utils/article'

/**
 * 文章检索（纯函数）
 * 匹配范围：标题 + 摘要 + 标签 + 正文。空关键词返回原数组。
 *
 * 正文不在首屏数据里（见 data/posts.ts），由调用方按需加载后经 bodies 传入；
 * bodies 缺省或某篇未加载时只匹配元数据，不影响标题 / 摘要 / 标签的命中。
 */
export function searchPosts(
  posts: readonly PostSummary[],
  keyword: string,
  bodies?: Record<string, ArticleBlock[]>,
): readonly PostSummary[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return posts

  return posts.filter((post) => {
    if (post.title.toLowerCase().includes(query)) return true
    if (post.excerpt.toLowerCase().includes(query)) return true
    if (post.tags.some((tag) => tag.toLowerCase().includes(query))) return true

    const blocks = bodies?.[post.slug]
    return blocks ? blocksPlainText(blocks).toLowerCase().includes(query) : false
  })
}
