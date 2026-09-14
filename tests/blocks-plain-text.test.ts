/**
 * blocksPlainText 等价性测试 —— TS / MJS 双实现的防漂移锁
 *
 * 同一份「正文块 → 纯文本」逻辑存在两个实现，这是刻意的架构取舍：
 *   - scripts/lib/articles.mjs（构建期：阅读时长、搜索索引）
 *   - src/utils/article.ts    （运行期：前端搜索匹配）
 * 一个在 Node 脚本里、一个要进浏览器包，无法直接共享，只能靠注释提醒「两边同步」。
 * 注释拦不住人，所以这里用同一组输入喂给两边，断言输出逐字相等 ——
 * 任何一侧新增块类型而漏改另一侧，这条测试会立刻红。
 */
import { describe, expect, it } from 'vitest'
// 构建脚本是 .mjs（无类型声明），仅取函数做等价性比对
import { blocksPlainText as buildSide } from '../scripts/lib/articles.mjs'
import { blocksPlainText as runtimeSide } from '@/utils/article'
import type { ArticleBlock } from '@/types'

const CASES: { name: string; blocks: ArticleBlock[] }[] = [
  {
    name: '有 text 字段的块（段落 / 标题 / 引用 / 代码）',
    blocks: [
      { type: 'paragraph', text: '第一段' },
      { type: 'heading', id: 'h1', text: '标题' },
      { type: 'quote', text: '引用' },
      { type: 'code', lang: 'ts', text: 'const a = 1' },
    ],
  },
  {
    name: '无序列表：纯字符串项与富文本项混排',
    blocks: [
      {
        type: 'list',
        ordered: false,
        items: ['纯文本项', { text: '富文本项', children: ['子项'], childrenOrdered: false }],
      },
    ],
  },
  {
    name: '有序列表：单项',
    blocks: [{ type: 'list', ordered: true, items: [{ text: '只有一项', children: [], childrenOrdered: false }] }],
  },
  {
    name: '表格：表头 + 多行',
    blocks: [
      {
        type: 'table',
        head: ['列A', '列B'],
        rows: [
          ['a1', 'b1'],
          ['a2', 'b2'],
        ],
      },
    ],
  },
  {
    name: '无文本字段的块（图片 / html 片段）应产出空串',
    blocks: [
      { type: 'image', src: '/cover.png', alt: '封面' },
      { type: 'html', html: '<div>片段</div>' },
    ],
  },
  {
    name: '混合顺序（块间以空格连接）',
    blocks: [
      { type: 'heading', id: 'h2', text: '开头' },
      { type: 'paragraph', text: '中间' },
      { type: 'list', ordered: false, items: ['结尾'] },
    ],
  },
  { name: '空数组', blocks: [] },
]

describe('blocksPlainText：构建端与运行端语义一致', () => {
  for (const { name, blocks } of CASES) {
    it(name, () => {
      expect(runtimeSide(blocks)).toBe(buildSide(blocks))
    })
  }

  it('有实际内容时输出非空（防止两边「一起退化成空串」而测试仍绿）', () => {
    const blocks: ArticleBlock[] = [{ type: 'paragraph', text: '内容' }]
    expect(buildSide(blocks)).toBe('内容')
    expect(runtimeSide(blocks)).toBe('内容')
  })
})
