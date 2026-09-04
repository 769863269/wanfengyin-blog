import type { ArticleBlock, Post } from '@/types'

/**
 * 文章检索（纯函数）
 * 匹配范围：标题 + 摘要 + 标签 + 正文。空关键词返回原数组。
 */
export function searchPosts(posts: readonly Post[], keyword: string): readonly Post[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return posts

  return posts.filter((post) => {
    if (post.title.toLowerCase().includes(query)) return true
    if (post.excerpt.toLowerCase().includes(query)) return true
    if (post.tags.some((tag) => tag.toLowerCase().includes(query))) return true

    return post.body.some(
      (block: ArticleBlock) => 'text' in block && block.text.toLowerCase().includes(query),
    )
  })
}
