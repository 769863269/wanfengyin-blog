---
slug: blog-rebuild-from-zero
title: 博客重构-从零到一
excerpt: 纯静态模板迁移到 Vite + Vue 3 + TS 的完整复盘：架构决策、迁移顺序、验证闭环。
cover: linear-gradient(135deg,#ff6b6b,#feca57)
publishedAt: 2026-08-08
views: 2310
commentCount: 31
tags: [随笔, Vue]
featured: true
---

重构不是推倒重来，是把散落的逻辑收拢到该在的位置。
## 架构决策
内容与结构分离是第一原则：文章、导航、友链全部抽成类型安全的数据模块，组件只负责渲染。composables 收拢主题、搜索、轮播等全局状态。
> 好架构的标志：加一篇文章、加一个页面，都不需要「碰」框架代码。
## 验证闭环
lint、类型检查、单测、构建、jsdom 冒烟五道关卡全绿才算完。重构最大的风险不是写错，是「以为没写错」。
