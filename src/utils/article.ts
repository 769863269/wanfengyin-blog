import type { ArticleBlock } from '@/types'

/**
 * 正文块 → 纯文本（阅读时长、搜索匹配等场景）。
 *
 * 依赖方向必须保持 data → utils：放进 data/posts.ts 会让纯函数工具反过来
 * 依赖数据模块（连带 vue 响应式与 localStorage），搜索单测也得多加载一堆东西。
 */
export function blocksPlainText(blocks: readonly ArticleBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'table') return [...block.head, ...block.rows.flat()].join(' ')
      if (block.type === 'list') {
        return block.items.map((item) => (typeof item === 'string' ? item : item.text)).join(' ')
      }
      return 'text' in block ? block.text : ''
    })
    .join(' ')
}
