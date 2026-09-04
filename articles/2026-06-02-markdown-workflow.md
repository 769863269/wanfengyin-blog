---
slug: markdown-workflow
title: markdown-工作流设计
excerpt: 发文成本决定博客寿命。设计了一套 Markdown + frontmatter 的发文流水线。
cover: linear-gradient(135deg,#5ee7df,#b490ca)
publishedAt: 2026-06-02
views: 1122
commentCount: 8
tags: [工具, 随笔]
featured: false
---

很多博客死于一件事：发一篇文章的流程太痛苦。
## 设计原则
文章就是 articles 目录下的一个 md 文件，frontmatter 声明元信息，构建时自动编译成类型安全的数据。缺字段、slug 重复、日期非法，构建直接报错拦下。
> 流水线的意义是把「坚持」变成「顺便」。
## 延伸产物
sitemap、RSS、预渲染 HTML 全部从同一份数据派生，新文章一发全部自动更新。
