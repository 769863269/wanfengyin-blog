---
slug: vite8-rolldown-migration
title: vite8-rolldown-迁移实录
excerpt: Vite 8 换用 Rolldown 构建引擎，冷启动和构建速度的变化，以及 manualChunks 那个 breaking change。
cover: /images/covers/vite8-rolldown-migration.jpg
publishedAt: 2026-08-30
views: 1823
commentCount: 23
tags: [Vite, 构建]
featured: true
---

Vite 8 底层换成了 Rolldown，性能提升是真实的：冷启动肉眼可见地快，生产构建时间近乎减半。
## 迁移成本
绝大多数项目零改动直迁。唯一踩到的 breaking change：manualChunks 不再接受对象形式，要改成函数返回。报错信息清晰，照着改就行。
> 工具链升级的正确姿势：先看 changelog 的 breaking changes，再动手。
## 体感
开发时的依赖预构建几乎无感，改代码的热更新稳定在毫秒级。这种「无感」恰恰是工具链成熟的标志。
