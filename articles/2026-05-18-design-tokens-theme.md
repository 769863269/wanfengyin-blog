---
slug: design-tokens-theme
title: 设计令牌与主题系统
excerpt: 颜色、间距、圆角、动效全部收敛为 CSS 变量，夜间模式只需覆盖一份令牌。
cover: linear-gradient(135deg,#a8edea,#fed6e3)
publishedAt: 2026-05-18
views: 1447
commentCount: 13
tags: [CSS]
featured: false
---

重构前样式里散落着几十个硬编码色值，夜间模式等于全文件搜索替换，改一次崩三处。
## 令牌化
品牌色、表面色、文字色、描边、阴影、圆角、动效曲线全部收敛为 CSS 变量，组件内禁止硬编码。
> 主题系统正确的打开方式：组件零感知，只换令牌。
## 效果
夜间模式只需在 html.night 里覆盖一份令牌表，所有组件自动适配。新增页面天然继承两套主题，这才是令牌系统的复利。
