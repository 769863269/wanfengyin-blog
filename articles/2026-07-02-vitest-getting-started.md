---
slug: vitest-getting-started
title: vitest-单测入门
excerpt: 纯函数是最好的单测对象。时间格式化、搜索、Markdown 转换器，33 个用例的思路拆解。
cover: /images/covers/vitest-getting-started.jpg
publishedAt: 2026-07-02
views: 934
commentCount: 6
tags: [测试, 工具]
featured: false
---

单测不是仪式感，是给未来的自己留的回归保险。

## 从哪测起

纯函数性价比最高：输入输出明确，一行断言一个行为，不依赖 DOM 不依赖网络。博客里最先被测的是三个工具函数：时间格式化、计数格式化、站内搜索。

```ts
import { describe, expect, it } from 'vitest'
import { formatCount } from '@/utils/format'

describe('formatCount', () => {
  it('不足一千原样输出', () => {
    expect(formatCount(892)).toBe('892')
  })

  it('千位缩写保留一位小数', () => {
    expect(formatCount(1593)).toBe('1.6k')
  })

  it('整千不显示小数点', () => {
    expect(formatCount(2000)).toBe('2k')
  })
})
```

> 先测逻辑，再测交互；先测纯函数，再测组件。

## 转换器是重点保护对象

Markdown 转换器是全文最复杂的纯函数，也是唯一会把字符串变成 HTML 的地方，必须重点测试。XSS 转义的用例就是在攻防里长出来的：

```ts
it('代码块里的 HTML 标签必须被转义', () => {
  const blocks = markdownToBlocks('```html\n<script>alert(1)</script>\n```')
  const html = blocksToHtml(blocks)
  expect(html).not.toContain('<script>')
  expect(html).toContain('&lt;script&gt;')
})

it('未闭合代码块取到文末且不吞后续解析', () => {
  const blocks = markdownToBlocks('```ts\nconst a = 1')
  expect(blocks[0]).toEqual({ type: 'code', lang: 'ts', text: 'const a = 1' })
})
```

## 边界意识

非法日期、空数组、超长字符串——这些「不会有人这么传」的参数，恰恰是最值得测的。formatRelativeTime 对非法日期返回原文而不是抛错，这个行为就是测试逼出来的设计。

## 运行与守护

测试挂在 CI 里，和 lint、类型检查并列为一道闸门。本地跑 npm test 秒级出结果，没有任何借口跳过。目前 33 个用例，覆盖三个模块，平均每个用例写下来不到两分钟，比出一次回归的排查成本低一个数量级。
