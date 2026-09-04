---
slug: vitest-getting-started
title: vitest-单测入门
excerpt: 纯函数是最好的单测对象。时间格式化、搜索、Markdown 转换器，33 个用例的思路拆解。
cover: linear-gradient(135deg,#43e97b,#38f9d7)
publishedAt: 2026-07-02
views: 934
commentCount: 6
tags: [测试, 工具]
featured: false
---

单测不是仪式感，是给未来的自己留的回归保险。
## 从哪测起
纯函数性价比最高：时间格式化、计数格式化、搜索过滤、Markdown 转换器。输入输出明确，一行断言一个行为。
> 先测逻辑，再测交互；先测纯函数，再测组件。
## 边界意识
非法日期、空数组、HTML 注入字符串——这些「不会有人这么传」的参数，恰恰是最值得测的。转换器的 XSS 转义测试就是在攻防里长出来的。
