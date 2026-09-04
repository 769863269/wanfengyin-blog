---
slug: css-grid-82-layout
title: css-grid-八二布局
excerpt: 主内容 8 份、侧栏 2 份的经典博客布局，用 Grid 三行搞定，附响应式收窄方案。
cover: linear-gradient(135deg,#89f7fe,#66a6ff)
publishedAt: 2026-08-15
views: 986
commentCount: 9
tags: [CSS]
featured: false
---

博客的 8:2 双栏布局，float 时代要写一堆清除，flex 时代要算比例，Grid 时代三行。
## 实现
grid-template-columns: 8fr 2fr，对齐方式交给 align-items。侧栏不随主列增长，天然 sticky 友好。
> 布局系统的进步，就是把 hack 变成语义。
## 响应式收窄
992px 以下侧栏隐藏、主列占满；600px 以下缩略图改纵向堆叠。断点的原则是内容先妥协，布局后妥协。
