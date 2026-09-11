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
status: published # 可选（Studio CMS）：draft 草稿 / review 审核中 / published 已发布 / offline 已下线；缺省视为已发布
category: 技术 # 可选（Studio CMS）：分类（单选）
author: 周周 # 可选（Studio CMS）：作者
pinned: true # 可选（Studio CMS）：列表置顶
keywords: [vite, 构建] # 可选（Studio CMS）：SEO 关键词，预渲染 meta keywords
seoDescription: 自定义 SEO 描述 # 可选（Studio CMS）：留空用 excerpt
publishAt: 2026-09-08 09:00 # 可选（Studio CMS）：定时发布，到点自动上线（需 Studio 运行）
offlineAt: 2026-10-01 00:00 # 可选（Studio CMS）：定时下线
---
```

## 正文语法

- `## 小标题` — 文章内标题
- `> 引文` — 引用块
- `![说明](图片地址)` — 图片（独占一行才解析）
- 空行分段，其余就是普通文字

## 图片（重要）

**一律用发布后台上传，不要把图片内联进正文。**

- 后台编辑器支持粘贴 / 选择图片，会自动上传到 `public/images/covers/`，正文只留
  `/images/covers/xxx.jpg` 这样的地址
- 手写文章时，图片地址用站内相对路径（`/images/covers/x.jpg`）或 `https://` 外链
- 单张图片上限 **4MB**，上传处会拦；建议先压到 200KB 以内
- 想进一步省体积可跑 `node scripts/optimize-images.mjs` 批量转 WebP（需先 `npm i -D sharp`）

**为什么不能内联 base64**：`![图](data:image/jpeg;base64,...)` 会被原样编译进前端
JavaScript，**每个访客打开任意页面都得先下载这张图**。曾有一篇测试文章内联了 230KB
的图，把首屏体积从 45KB 顶到 372KB。构建时检测到 base64 会**直接报错中断**。

## 状态与生命周期（Studio CMS）

- 只有 `status: published`（或缺省）的文章会进构建；draft / review / offline 只存在于仓库，不出现在线上
- 状态机：draft → review → published → offline（可回到 draft / 重新上线）
- 推荐用发布后台管理（npm run studio）：可视化状态切换、置顶/推荐、定时上下线、回收站、操作日志

## 发布

`npm run dev` / `npm run build` 前会**自动**重新编译文章数据，
也可以手动执行 `npm run posts`。

字段校验在这一步做：slug 重复、日期格式错、缺必填字段、单篇源文件超过 64KB、
正文内联 base64 图片——都会直接报错并中断，坏数据进不了构建。

## 注意

- `src/data/posts.generated.ts`（文章元数据）与 `src/data/posts.body.generated.ts`（正文）
  都是编译产物，**不要手工编辑**。正文单独成文件是为了按需加载：只有详情页用得上，
  放进首屏会让每个访客先下载全部文章全文
- 文章一经发布，修改 slug 会导致旧链接 404，慎重
