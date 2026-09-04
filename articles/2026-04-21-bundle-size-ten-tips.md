---
slug: bundle-size-ten-tips
title: 打包体积优化十连
excerpt: 首屏 JS 从 380KB 压到 55KB 的完整记录：分包、懒加载、按需引入，十招全部实战验证。
publishedAt: 2026-04-21
views: 1593
commentCount: 17
tags: [性能优化, 构建]
featured: false
---

首屏 380KB JS，弱网下白屏三秒，忍不了。这次集中治理，完整记录每一步的收益。

## 第一招：路由级代码分割

收益最大的一招。所有页面打进一个包，等于让首屏用户替详情页、归档页买单。改成路由懒加载后首包直接砍半：

```ts
const routes = [
  { path: '/', component: HomeView },
  {
    path: '/post/:slug',
    component: () => import('@/views/PostView.vue'),
  },
  {
    path: '/archives',
    component: () => import('@/views/ArchiveView.vue'),
  },
]
```

## 第二招：框架与业务分包

框架代码半年不变，业务代码天天变。分开打包后，用户浏览器里的框架缓存长期有效：

```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) return 'vue'
        return undefined
      },
    },
  },
}
```

注意 Vite 8 里 manualChunks 只接受函数形式，对象写法会直接报错。

## 第三招：干掉全量引入

「顺手装」的依赖最会偷偷吃体积。一个只用了两个图标库函数的组件，全量引入多背了 60KB。按需引入后只剩 3KB。

## 第四到十招（速览）

CSS 代码分割是被严重低估的一招，拆完首屏样式体积降了 40%。剩下的按收益排序：图片压缩、Tree Shaking 确认开启、分析产物找大依赖、动态 import 拆低频功能、移除死代码、生产环境关掉 sourcemap。

> 体积优化的本质是：只加载当前页面需要的东西。每招单看都微小，叠起来就是 380KB 到 55KB 的差距。
