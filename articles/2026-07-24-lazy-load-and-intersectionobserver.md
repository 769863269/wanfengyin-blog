---
slug: lazy-load-and-intersectionobserver
title: 懒加载与-intersectionobserver
excerpt: 从监听 scroll 到 IntersectionObserver，图片懒加载的演进史与兼容性兜底方案。
cover: /images/covers/lazy-load-and-intersectionobserver.jpg
publishedAt: 2026-07-24
views: 879
commentCount: 7
tags: [性能优化]
featured: false
---

懒加载的原理一句话：视口外的图不加载。难点全在「怎么知道进入了视口」。
## 演进
老方案监听 scroll 事件算几何，节流写不好就是性能灾难。IntersectionObserver 把判断交给浏览器，主线程零开销。
> 让浏览器做浏览器擅长的事。
## 兜底
不支持 IO 的环境直接降级为立即加载。兼容性兜底的原则：宁可多加载，不能白屏。
