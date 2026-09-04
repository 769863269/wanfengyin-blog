---
slug: github-actions-auto-deploy
title: github-actions-自动部署
excerpt: git push 之后的一切自动完成：类型检查、单测、构建、预渲染、发布。CI 配置逐行讲解。
cover: linear-gradient(135deg,#13547a,#80d0c7)
publishedAt: 2026-06-25
views: 1268
commentCount: 10
tags: [部署, 工具]
featured: false
---

部署这种事，手动做第三次就该写脚本了。
## 流水线设计
push 触发：装依赖 → 类型检查 → 单测 → 构建（含预渲染和 sitemap）→ 发布产物。任何一步红了，部署不会发生。
> CI 的价值不是快，是「坏东西绝对上不了线」。
## 踩坑
Node 版本要锁死在 .nvmrc，本地能跑线上挂多半是环境漂移。缓存 node_modules 能把构建时间从三分钟压到五十秒。
