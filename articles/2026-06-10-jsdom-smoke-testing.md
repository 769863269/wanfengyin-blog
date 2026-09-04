---
slug: jsdom-smoke-testing
title: jsdom-冒烟测试实践
excerpt: 不启浏览器、不依赖后端，20 项核心交互 3 分钟跑完。jsdom 冒烟测试的完整实践。
publishedAt: 2026-06-10
views: 803
commentCount: 5
tags: [测试]
featured: false
---

每次改完 UI 都手动点一遍？不现实。真浏览器自动化又太重。折中方案：jsdom 冒烟测试。

## 基建

jsdom 不执行 ES module，先用 Vite 把整个应用打成 IIFE 单文件测试包，再在 jsdom 里挂载运行：

```js
import { JSDOM } from 'jsdom'

const dom = await JSDOM.fromFile('dist-smoke/index.html', {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
})

await waitFor(() => dom.window.document.querySelector('.post-card'))
```

然后逐项断言核心路径：列表渲染、标签筛选、加载更多、进详情、返回恢复滚动位置。每一项都是真实点击事件驱动，不是查 DOM 结构凑数。

## 断言要等，不要睡

固定 sleep 断言必然时序抖动：机器慢一次全红，机器快一次全浪费。全部换成轮询等待：

```js
async function waitFor(fn, timeout = 3000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const result = fn()
      if (result) return result
    } catch {
      /* 条件未就绪，继续轮询 */
    }
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('waitFor 超时')
}
```

## 环境缺口要补

jsdom 不实现 window.matchMedia，页面代码一旦直接调用就抛错并中断整个脚本块——后面所有初始化逻辑全不执行。测试前先 polyfill：

```js
dom.window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
})
```

这个 polyfill 还帮了大忙：它暴露过一个真实 bug——页面直接调 matchMedia 没有降级，真机某些环境一样会炸。

> 冒烟测试不求覆盖全，只求核心路径永不静默坏死。

## 收益

目前 21 项断言 3 分钟跑完，挂在 build 后面自动执行。这几个月它抓回来的回归：滚动恢复残留、加载更多状态丢失、返回按钮失效。每一次都是发布前抓住，不是用户。
