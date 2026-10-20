---
slug: blog-tech-stack
title: 晚风吟博客技术栈总结
excerpt: 这套博客的完整技术盘点：Vite 8 + Vue 3.5 + TS 6 的底座，Markdown 发文流水线，自研本机 CMS，构建期 SEO 预渲染，以及一套不依赖浏览器的冒烟测试。
publishedAt: 2026-10-20
tags: [Vue, Vite, 工具]
author: 周周
status: published
keywords: [vite, vue3, typescript, 静态博客, cms]
category: 技术
---

博客重构完一直没正经写过复盘，这次把整套技术摊开讲一遍。选型的核心判断只有一条：**这是个人博客，不是平台**。能用构建期解决的不上服务端，能本机做的不上云。

## 底座：Vite 8 + Vue 3.5 + TS 6

三个部件都没选保守版本：

- **Vite 8（Rolldown 内核）**——构建速度是旧版 Rollup 管线的数倍，dev 冷启动基本秒进
- **Vue 3.5**——全量 `<script setup>` 组合式 API，全局状态（主题、搜索、轮播）收进 composables，谁的状态谁管理
- **TypeScript 6，strict 全开**——包括文章数据在内的所有数据结构都有类型，编译期先拦一道

路由用 vue-router 5 的 history 模式，文章页按 slug 懒加载分包，配 404 页和随机文章。

## 发文：Markdown + frontmatter

发文不碰任何代码。在 `articles/` 目录扔一个 `YYYY-MM-DD-slug.md`，frontmatter 里写 slug、标题、摘要、日期、标签，构建时自动编译成 `posts.generated.ts`。

这一步同时做校验：slug 重复、缺必填字段、单篇超 64KB、正文内联 base64 图片——任何一条不过直接中断构建。坏数据进不了线上，这是内容站最划算的一道闸门。

正文单独拆成 `posts.body.generated.ts` 按需加载，列表页不背全文的体积。

## 后台：自研本机 CMS

配套写了一个 CMS 后台（studio），管文章、页面、导航和站点文案。几个关键决策：

- **只监听 127.0.0.1:5199**，没有登录体系。它直接读写本机文件、调本机 git，本质是本机工具，公网无入口即零攻击面
- **零构建 ESM**，几个 `.mjs` 文件直接跑，没有打包环节就没有构建 bug
- **文章状态机**：draft → review → published → offline，只有 published 会进构建；支持定时上下线、回收站、操作日志
- **推送带保险**：同步 GitHub 走白名单暂存 + 密钥扫描，密钥扫不出来不放行

## SEO：构建期预渲染

百度等爬虫不执行 JS，纯 SPA 等于对搜索引擎隐身。解法在构建后补一步预渲染：每篇文章生成完整静态 HTML，爬虫直接吃。顺带产出：

- sitemap.xml——站点地图
- feed.xml——RSS 2.0，独立博客最后的关注通道
- 404.html——静态托管的 history 路由 fallback

部署在 Vercel，推 main 自动构建。安全响应头（CSP、X-Frame-Options）收口在 `vercel.json` 一个文件，另有脚本校验它和 `_headers` 的配置一致，防止两份配置漂移。

## 质量：不启浏览器的测试闭环

- **Vitest 单测**——覆盖格式化、搜索、Markdown 转换、导航解析这些纯函数
- **jsdom 冒烟测试**——构建一个 IIFE 单文件测试包，在 jsdom 里挂载完整应用，断言挂载、主题切换、搜索、路由、加载更多等核心交互，3 分钟跑完
- **ESLint 10 flat config + Prettier + vue-tsc**，一条 `npm run verify` 串起来

## 小结

整套东西没有一个服务端进程暴露在公网：静态构建产物 + 本机工具 + Git 推送触发 CI。个人博客的复杂度预算就该花在内容和构建流水线上，而不是运维上。

后续文章会拆开讲几个值得单独成篇的点：设计令牌与夜间模式、预渲染细节、冒烟测试的写法。
