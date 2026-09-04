---
slug: lazy-load-directive
title: 图片懒加载指令封装
excerpt: 把 IntersectionObserver 封装成 v-lazy-bg 指令，一行指令搞定背景图懒加载。
cover: linear-gradient(135deg,#a1c4fd,#c2e9fb)
publishedAt: 2026-04-12
views: 892
commentCount: 6
tags: [Vue, 性能优化]
featured: false
---

列表页几十张封面图，一次性全加载等于自杀。原生 loading 属性只管 img 标签，背景图就得自己来。
## 指令设计
封装成 v-lazy-bg 指令：挂载时观察元素，进入视口才把真实 URL 写入样式。不支持 IntersectionObserver 的环境直接降级为立即加载。
> 兜底逻辑的优先级永远高于炫技。
## 细节
卸载时记得 unobserve，不然单页应用切几次路由监听器就堆成山了。这个坑不报错，只会慢慢变卡，很难排查。
