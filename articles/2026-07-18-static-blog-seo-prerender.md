---
slug: static-blog-seo-prerender
title: 静态博客-seo-预渲染
excerpt: 百度不执行 JS，SPA 等于对搜索引擎隐身。构建时预渲染每篇文章，收录问题一次解决。
cover: /images/covers/static-blog-seo-prerender.jpg
publishedAt: 2026-07-18
views: 1315
commentCount: 12
tags: [SEO, 部署]
featured: true
---

单页应用再漂亮，搜索引擎爬虫看到的只有一个空 div。对个人博客来说这是致命伤。
## 预渲染方案
文章是纯静态数据，最适合构建时生成：每篇文章输出一份完整 HTML，标题、描述、og 标签、正文全文都在。浏览器打开后应用照常接管，用户无感知。
> 预渲染的本质：给爬虫看的和给人看的，是同一份内容的不同时刻快照。
## 配套
sitemap 和 robots.txt 同样构建时生成，从文章数据派生，永不手工同步。
