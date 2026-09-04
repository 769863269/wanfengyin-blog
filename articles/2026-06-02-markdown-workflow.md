---
slug: markdown-workflow
title: markdown-工作流设计
excerpt: 发文成本决定博客寿命。设计了一套 Markdown + frontmatter 的发文流水线。
cover: /images/covers/markdown-workflow.jpg
publishedAt: 2026-06-02
views: 1122
commentCount: 8
tags: [工具, 随笔]
featured: false
---

很多博客死于一件事：发一篇文章的流程太痛苦。写正文只要半小时，改数据文件、调格式、对位置要一小时，第四次就会放弃。

## 设计原则

文章就是 articles 目录下的一个 md 文件，frontmatter 声明元信息，正文纯 Markdown：

```md
---
slug: my-new-post
title: 新文章标题
excerpt: 一句话摘要，列表页展示
cover: /images/covers/my-new-post.jpg
publishedAt: 2026-06-02
tags: [Vue]
---

正文直接写，支持标题、引文、图片和代码块。
```

保存即完成。dev 和 build 前的钩子自动把目录里所有 md 编译成一个类型安全的数据模块，手滑的机会为零。

## 校验前置

坏数据在构建期拦下，绝不流进页面。缺必填字段、slug 重复、日期格式不对、正文为空，构建直接报错退出：

```js
for (const field of ['slug', 'title', 'excerpt', 'publishedAt', 'tags']) {
  if (!data[field]) fail(file, `frontmatter 缺少必填字段 "${field}"`)
}
if (seenSlugs.has(data.slug)) fail(file, `slug "${data.slug}" 重复`)
if (!ISO_DATE.test(data.publishedAt)) fail(file, 'publishedAt 必须是 YYYY-MM-DD 格式')
```

报错信息带文件名和字段名，三十秒定位。校验这种事，晚发生一秒都是浪费。

## 转换器刻意保持克制

Markdown 到页面只支持五种块：标题、段落、引文、图片、代码块。不支持嵌套列表和表格，因为转换器是自己写的，每加一种语法就多一份解析和转义成本。

> 流水线的意义是把「坚持」变成「顺便」。

## 延伸产物

sitemap、RSS、预渲染 HTML 全部从同一份数据派生，新文章一发全部自动更新。一次输入，四处产出，这才是数据驱动该有的样子。
