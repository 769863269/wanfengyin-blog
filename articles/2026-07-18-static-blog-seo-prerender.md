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

单页应用再漂亮，搜索引擎爬虫看到的只有一个空 div。对靠内容吃饭的个人博客来说这是致命伤。

## 问题本质

SPA 的 HTML 壳里没有内容，正文全靠 JS 运行时渲染。Google 能执行 JS，百度基本不执行。所以同一个站，Google 收录正常，百度眼里你是个空站。

## 预渲染方案

文章本来就是构建时的静态数据，最适合构建时生成完整 HTML。postbuild 脚本为每篇文章输出一份独立 HTML：标题、描述、og 标签、正文全文都在：

```js
// scripts/prerender.mjs 核心逻辑
for (const post of posts) {
  const html = shell
    .replace('<!-- TITLE -->', escapeHtml(post.title))
    .replace('<!-- META -->', buildMetaTags(post))
    .replace('<!-- PRERENDERED -->', blocksToHtml(post.body))

  const dir = join(distDir, 'post', post.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}
```

关键点：正文也预渲染进去，而不是只渲染壳。爬虫拿到的和用户看到的，是同一份内容。

> 预渲染的本质：给爬虫看的和给人看的，是同一份内容的不同时刻快照。

## 接管无感知

浏览器打开预渲染页，静态正文先显示，随后 Vue 应用挂载接管，用户全程无感知。因为类名结构对齐了同一套渲染约定，接管瞬间不会闪一下。

## 配套

sitemap 和 robots.txt 同样构建时生成，从文章数据派生，永不手工同步：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/post/vite8-rolldown-migration/</loc>
    <lastmod>2026-08-30</lastmod>
  </url>
</urlset>
```

每篇文章的 canonical 和 og 标签一并对齐，分享到社交平台也有像样的卡片。整套下来收录问题一次解决，之后每篇新文章自动享受全套待遇。
