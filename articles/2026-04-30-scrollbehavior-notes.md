---
slug: scrollbehavior-notes
title: scrollbehavior-踩坑记录
excerpt: scrollBehavior 写了 savedPosition 却不生效？查了一晚上，凶手是页面过渡动画。
publishedAt: 2026-04-30
views: 1076
commentCount: 9
tags: [Vue]
featured: false
---

明明配置了 savedPosition 恢复，返回上一页却总是落在错误的位置。这个问题断断续续查了一晚上。

## 表象

从列表页进详情页，返回后浏览器记住的滚动位置时而生效时而失效；偶尔还会先跳对位置、再被拽回顶部，像两段代码在打架。

## 真相

页面切换用了 out-in 过渡。scrollBehavior 触发时新页面还没挂载，旧页面还占着 DOM。此刻执行 window.scrollTo，滚动高度按旧页面算，位置自然不对：

```ts
// 错误示范：时序上滚了个寂寞
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      window.scrollTo(savedPosition.left, savedPosition.top)
    }
    return { top: 0 }
  },
})
```

> 过渡动画和滚动恢复的执行时序冲突，是单页应用的经典暗坑。两套机制各干各的，谁也不等谁。

## 解法：把滚动时机交给过渡

scrollBehavior 里只记录位置并返回 false（跳过默认滚动），等新页面的 enter 钩子触发、DOM 真正就绪后再滚：

```ts
let pendingRestore: { left: number; top: number } | null = null

const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      pendingRestore = savedPosition
      return false // 先不滚，等过渡完成
    }
    pendingRestore = null
    return { top: 0 }
  },
})

// 页面过渡的 @enter 钩子里执行真正的滚动
function onPageEnter() {
  if (pendingRestore) {
    window.scrollTo(pendingRestore.left, pendingRestore.top)
    pendingRestore = null
  }
}
```

## 还有一个隐藏坑

同组件路由之间的导航（比如首页和首页加筛选参数）不会触发过渡动画，enter 钩子不执行，pendingRestore 就成了残留状态，下次随便一次导航都可能被它误滚一次。解法是前进导航时主动清空记录。

修完这两处，返回恢复终于稳定了。时序问题没有玄学，只有没对齐的钩子。
