---
slug: lazy-load-directive
title: 图片懒加载指令封装
excerpt: 把 IntersectionObserver 封装成 v-lazy-bg 指令，一行指令搞定背景图懒加载。
publishedAt: 2026-04-12
views: 892
commentCount: 6
tags: [Vue, 性能优化]
featured: false
---

列表页几十张封面图，一次性全加载等于自杀。原生 loading 属性只管 img 标签，背景图就得自己来。

## 指令设计

封装成 v-lazy-bg 指令：挂载时用 IntersectionObserver 观察元素，进入视口（提前 200px）才把真实图写入样式。核心实现不到三十行：

```ts
import type { Directive } from 'vue'

type LazyEl = HTMLElement & { _observer?: IntersectionObserver }

export const lazyBg: Directive<LazyEl, string> = {
  mounted(el, binding) {
    if (!binding.value) return
    if (typeof IntersectionObserver === 'undefined') {
      el.style.backgroundImage = `url("${binding.value}")`
      return
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          el.style.backgroundImage = `url("${binding.value}")`
          obs.unobserve(el)
        }
      },
      { rootMargin: '200px 0px' },
    )
    el._observer = observer
    observer.observe(el)
  },
  unmounted(el) {
    el._observer?.disconnect()
  },
}
```

模板里用起来就是一行：

```html
<div v-lazy-bg="post.cover" class="post-card__thumb" />
```

## 两个必须处理的细节

第一是卸载清理。unmounted 里不 disconnect 的话，单页应用切几次路由监听器就堆成山了。这个坑不报错，只会慢慢变卡，很难排查。

第二是值兼容。值可能是裸路径，也可能是 linear-gradient 这种 CSS 值，写入前要判断是否需要包 url()，否则渐变和图片只能活一个。

> 兜底逻辑的优先级永远高于炫技：环境不支持观察器就立即加载，宁可多加载也不能让图永远不出来。

## 值变化怎么办

列表筛选后复用的卡片组件会拿到新 cover，updated 钩子里要断开旧观察器、重建新的。偷懒不处理的话，切标签会出现图对不上号的灵异现象。
