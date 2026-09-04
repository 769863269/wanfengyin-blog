---
slug: error-boundary
title: 前端错误边界兜底
excerpt: 一个组件报错不该拖垮整页。用 onErrorCaptured 给应用兜底，白屏问题从此绝迹。
publishedAt: 2026-05-26
views: 954
commentCount: 7
tags: [Vue]
featured: false
---

线上见过最冤的白屏：某个边角组件抛了个错，整页跟着陪葬。
## 兜底方案
根组件挂 onErrorCaptured，捕获后上报并阻断传播；局部组件各自降级渲染占位。
> 错误处理的目标不是消灭报错，而是让报错的爆炸半径可控。
## 配套动作
环境探测类 API（matchMedia、IntersectionObserver）全部封装降级版本，不支持的浏览器走兜底分支，绝不中断脚本。
