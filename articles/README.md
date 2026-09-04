# 发文指南

在 `articles/` 目录新建 `.md` 文件即可发文，**不需要碰任何 TS 代码**。
文件名建议 `YYYY-MM-DD-slug.md`（slug 会进 URL，如 `/post/rest-day`）。

## Frontmatter 字段

```yaml
---
slug: rest-day # 必填，URL 标识，全站唯一
title: 休息日 # 必填，文章标题
excerpt: 摘要文字…… # 必填，列表页摘要
publishedAt: 2026-09-02 # 必填，YYYY-MM-DD
tags: [生活, 随笔] # 必填，数组
cover: /images/covers/my-cover.jpg # 可选，封面图。无图时删除本行，卡片不留占位
views: 609 # 可选，展示用阅读数
commentCount: 12 # 可选，展示用评论数
featured: true # 可选，true 时进首页轮播
---
```

## 正文语法

- `## 小标题` — 文章内标题
- `> 引文` — 引用块
- `![说明](图片地址)` — 图片（独占一行）
- 空行分段，其余就是普通文字

## 发布

`npm run dev` / `npm run build` 前会**自动**重新编译文章数据，
也可以手动执行 `npm run posts`。

字段校验在这一步做：slug 重复、日期格式错、缺必填字段会直接报错并中断，坏数据进不了构建。

## 注意

- `src/data/posts.generated.ts` 是编译产物，**不要手工编辑**
- 文章一经发布，修改 slug 会导致旧链接 404，慎重
