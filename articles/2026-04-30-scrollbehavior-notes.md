---
slug: scrollbehavior-notes
title: scrollbehavior-踩坑记录
excerpt: scrollBehavior 写了 savedPosition 却不生效？查了一晚上，凶手是页面过渡动画。
cover: linear-gradient(135deg,#fbc2eb,#a6c1ee)
publishedAt: 2026-04-30
views: 1076
commentCount: 9
tags: [Vue]
featured: false
---

明明配置了 savedPosition 恢复，返回上一页却总是落在错误的位置。这个问题断断续续查了一晚上。
## 真相
页面切换用了 out-in 过渡：scrollBehavior 触发时新页面还没挂载，旧页面还占着 DOM。此刻滚动会被旧页面高度截断。
> 过渡动画和滚动恢复的执行时序冲突，是单页应用的经典暗坑。
## 解法
scrollBehavior 里只记录位置并返回 false，等新页面 enter 钩子触发再真正滚动。另有一个隐藏坑：同组件路由间的返回不会触发过渡，记得在前进导航时清掉残留位置。
