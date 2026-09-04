---
slug: blog-rebuild-from-zero
title: 博客重构-从零到一
excerpt: 纯静态模板迁移到 Vite + Vue 3 + TS 的完整复盘：架构决策、迁移顺序、验证闭环。
cover: /images/covers/blog-rebuild-from-zero.jpg
publishedAt: 2026-08-08
views: 2310
commentCount: 31
tags: [随笔, Vue]
featured: true
---

重构不是推倒重来，是把散落的逻辑收拢到该在的位置。旧版是纯 HTML + CSS + JS 模板，能跑，但加功能全靠复制粘贴。

## 架构决策

内容与结构分离是第一原则。文章、导航、友链、站点配置全部抽成数据模块，组件只负责渲染：

```ts
// src/config/site.ts —— 站点配置与页面彻底解耦
export const siteConfig = {
  name: '晚风吟',
  url: 'https://example.com',
  nav: [
    { id: 'home', label: '首页', icon: '🏠', kind: 'route', to: 'home' },
    { id: 'archive', label: '归档', icon: '🗂', kind: 'route', to: 'archive' },
    { id: 'rss', label: 'RSS', icon: '📡', kind: 'external', href: '/feed.xml' },
  ],
} as const
```

全局状态（主题、搜索、轮播）收进 composables，谁的状态谁管理：

```ts
// src/composables/useTheme.ts
const theme = ref<ThemeMode>('light')

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.classList.toggle('night', theme.value === 'dark')
    localStorage.setItem('theme', theme.value)
  }
  return { theme, toggle }
}
```

> 好架构的标志：加一篇文章、加一个页面，都不需要「碰」框架代码。

## 迁移顺序

先搭骨架（构建器、路由、类型定义），再搬页面（从静态 HTML 逐页转 SFC），最后搬数据（文章进 Markdown 流水线）。旧版整个留作对照，迁移期间随时比对视觉和行为差异。

## 验证闭环

lint、类型检查、单测、构建、jsdom 冒烟五道关卡全绿才算完。冒烟测试在重构里最值：旧版的交互行为全部固化成断言，新实现只要全过，行为就没丢。

> 重构最大的风险不是写错，是「以为没写错」。

## 复盘

这次重构最值钱的决定是先建数据层再做组件。数据结构定了，组件的 props 和 composables 的接口自然清晰，返工率为零。反过来先写组件后定数据的话，至少返工一轮。
