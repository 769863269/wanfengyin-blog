import { describe, expect, it } from 'vitest'
import { searchPosts } from '@/utils/search'
import type { Post } from '@/types'

function makePost(overrides: Partial<Post>): Post {
  return {
    slug: 'demo',
    title: '默认标题',
    excerpt: '默认摘要',
    cover: '',
    publishedAt: '2026-01-01',
    views: 0,
    commentCount: 0,
    tags: ['生活'],
    body: [{ type: 'paragraph', text: '默认正文' }],
    ...overrides,
  }
}

const posts = [
  makePost({ slug: 'a', title: '无锡的甜', tags: ['生活', '工作'] }),
  makePost({ slug: 'b', title: '牛马生活', body: [{ type: 'paragraph', text: '提到无锡的排骨' }] }),
  makePost({ slug: 'c', title: '无关文章', excerpt: '完全不同的内容' }),
]

describe('searchPosts', () => {
  it('空关键词返回原数组', () => {
    expect(searchPosts(posts, '')).toHaveLength(3)
    expect(searchPosts(posts, '   ')).toHaveLength(3)
  })

  it('匹配标题', () => {
    expect(searchPosts(posts, '无锡的甜').map((p) => p.slug)).toEqual(['a'])
  })

  it('匹配标签', () => {
    expect(searchPosts(posts, '工作').map((p) => p.slug)).toEqual(['a'])
  })

  it('匹配正文', () => {
    expect(searchPosts(posts, '排骨').map((p) => p.slug)).toEqual(['b'])
  })

  it('大小写不敏感', () => {
    const en = [makePost({ slug: 'x', title: 'Vue Router Guide' })]
    expect(searchPosts(en, 'vue')).toHaveLength(1)
  })

  it('无匹配返回空数组', () => {
    expect(searchPosts(posts, '不存在的关键词xyz')).toEqual([])
  })
})
