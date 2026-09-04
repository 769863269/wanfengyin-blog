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

## 史前方案：监听 scroll

老方案在 scroll 事件里手动算几何：元素顶边和视口底边的距离小于阈值就加载。能跑，但有两个硬伤：

```js
// 每个 scroll 帧都在做几何计算，节流写不好就是性能灾难
window.addEventListener('scroll', () => {
  document.querySelectorAll('img[data-src]').forEach((img) => {
    const rect = img.getBoundingClientRect()
    if (rect.top < window.innerHeight + 200) {
      img.src = img.dataset.src
    }
  })
})
```

主线程本来就忙，滚动时还要替每个候选图片算位置，低端机直接掉帧。加载完的图不摘除监听的话，越滚越卡。

## 现代方案：IntersectionObserver

观察器把「判断进入视口」交给浏览器，浏览器在合成阶段就知道答案，主线程零开销：

```js
const observer = new IntersectionObserver(
  (entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.src = entry.target.dataset.src
      obs.unobserve(entry.target) // 加载后立刻摘除，不占名额
    }
  },
  { rootMargin: '200px 0px' }, // 提前 200px 预载
)

document.querySelectorAll('img[data-src]').forEach((img) => observer.observe(img))
```

代码量还更少。唯一的「成本」是理解回调是异步批量触发的，别在回调里做重活。

> 让浏览器做浏览器擅长的事。

## 原生 loading 属性

img 标签现在有原生方案：

```html
<img src="cover.jpg" loading="lazy" decoding="async" alt="封面" />
```

一行搞定，应该作为默认选择。但它只管 img 标签，背景图无能为力——背景图的懒加载还是得靠观察器，这就是本项目封装 v-lazy-bg 指令的原因。

## 兜底

不支持观察器的环境直接降级为立即加载：

```js
if (typeof IntersectionObserver === 'undefined') {
  loadAllImmediately()
} else {
  observeAll()
}
```

兼容性兜底的原则：宁可多加载，不能白屏。懒加载是优化，不是功能，优化不该有致死的可能。
