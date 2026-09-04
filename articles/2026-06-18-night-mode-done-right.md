---
slug: night-mode-done-right
title: 夜间模式的正确实现
excerpt: 不做暗色分支判断，只换设计令牌。夜间模式从「全文件搜索替换」变成「覆盖一份变量表」。
cover: linear-gradient(135deg,#232526,#414345)
publishedAt: 2026-06-18
views: 1687
commentCount: 21
tags: [CSS, Vue]
featured: true
---

夜间模式最常见的实现是在组件里写一堆 .night 分支，结果样式文件比业务代码还难维护。
## 令牌方案
所有颜色收敛为 CSS 变量，html.night 只覆盖变量表。组件里没有一行暗色判断，切主题就是换一层皮。
> 判断逻辑收拢到一处，比散落在十个文件里健康一百倍。
## 两个细节
主题偏好存 localStorage 并跟随系统 prefers-color-scheme；切换时给根节点加过渡类，只让参与变色的容器做动画，避免全局 transition 的性能损耗。
