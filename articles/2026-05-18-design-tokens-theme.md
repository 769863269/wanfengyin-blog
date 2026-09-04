---
slug: design-tokens-theme
title: 设计令牌与主题系统
excerpt: 颜色、间距、圆角、动效全部收敛为 CSS 变量，夜间模式只需覆盖一份令牌。
cover: /images/covers/design-tokens-theme.jpg
publishedAt: 2026-05-18
views: 1447
commentCount: 13
tags: [CSS]
featured: false
---

重构前样式里散落着几十个硬编码色值，夜间模式等于全文件搜索替换，改一次崩三处。

## 令牌化

品牌色、表面色、文字色、描边、阴影、圆角、动效曲线全部收敛为 CSS 变量，组件内禁止硬编码：

```css
:root {
  --brand: #4a7dff;
  --bg-page: #f7f7f8;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --radius-md: 12px;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 8%);
  --duration-base: 0.25s;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

组件里只允许引用令牌，一个裸色值都不留：

```css
.post-card {
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: color var(--duration-base) var(--ease-standard);
}
```

## 命名按用途，不按色值

令牌叫 --text-secondary 而不是 --gray-500，叫 --bg-surface 而不是 --white。色值会随设计改版变，用途不会。这个命名纪律是令牌系统能长期维护的前提。

> 主题系统正确的打开方式：组件零感知，只换令牌。

## 效果

夜间模式只需在 html.night 里覆盖一份令牌表，所有组件自动适配：

```css
html.night {
  --bg-page: #111113;
  --bg-surface: #1c1c1e;
  --text-primary: #f5f5f7;
  --text-secondary: #98989d;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 60%);
}
```

新增页面天然继承两套主题，这才是令牌系统的复利。后来加的深色代码块也只花了十分钟——因为文章容器只感知令牌，代码块自己定义局部变量就行。
