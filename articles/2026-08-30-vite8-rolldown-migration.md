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

Vite 8 底层换成了 Rolldown（Rust 写的打包器），性能提升是真实的：冷启动肉眼可见地快，生产构建时间近乎减半。

## 迁移成本

绝大多数项目零改动直迁，这个项目只踩到一个 breaking change：manualChunks 不再接受对象形式。

```ts
// Vite 7 及以前：对象写法
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vue: ['vue', 'vue-router'],
      },
    },
  },
}
```

```ts
// Vite 8：必须函数返回
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

报错信息写得清楚，照着改就行。工具链升级的正确姿势：先看 changelog 的 breaking changes，再动手，五分钟的事别变成五小时的考古。

## 速度对比

同一个项目（20 篇文章 + 预渲染 + sitemap/RSS 生成）的粗测数据：

```text
                     Vite 7      Vite 8 (Rolldown)
冷启动 dev           ~1.8s       ~0.9s
生产构建             ~11s        ~5.9s
依赖预构建           明显等待     几乎无感
```

热更新稳定在毫秒级，改代码到浏览器更新的延迟低到可以忽略。这种「无感」恰恰是工具链成熟的标志——好的工具是感觉不到的工具。

## 插件生态

Rolldown 兼容大部分 Rollup 插件 API，项目里自写的 sitemap、RSS、预渲染插件全部原样能跑。构建日志里多了一个 plugin-timings 输出，能直接看到每个插件钩子耗时的占比，排查构建慢有据可依。

## 建议

新项目直接上 Vite 8，没有理由用旧的。存量项目升级前把 Node 版本和 lockfile 锁好，跑一遍完整构建加测试再合并。这次迁移全程不到半小时，其中二十分钟在看 changelog——这比例是对的。
