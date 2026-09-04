---
slug: jsdom-smoke-testing
title: jsdom-冒烟测试实践
excerpt: 不启浏览器、不依赖后端，20 项核心交互 3 分钟跑完。jsdom 冒烟测试的完整实践。
cover: linear-gradient(135deg,#cfd9df,#e2ebf0)
publishedAt: 2026-06-10
views: 803
commentCount: 5
tags: [测试]
featured: false
---

每次改完 UI 都手动点一遍？不现实。真浏览器自动化又太重。折中方案：jsdom 冒烟测试。
## 基建
jsdom 不执行 ES module，先用 Vite 打 IIFE 单文件测试包，再在 jsdom 里挂载完整应用逐项断言。
> 冒烟测试不求覆盖全，只求核心路径永不静默坏死。
## 踩过的坑
固定 sleep 断言会时序抖动，全部换成轮询等待；matchMedia 未实现会中断整个脚本，记得 polyfill。
