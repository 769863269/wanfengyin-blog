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

线上见过最冤的白屏：某个边角组件抛了个错，整页跟着陪葬。用户视角里整站挂了，实际只是评论区挂了。

## 兜底方案

根组件挂 onErrorCaptured，捕获子树错误后上报并阻断传播，返回 false 阻止继续向上炸：

```ts
// App.vue
import { onErrorCaptured, ref } from 'vue'

const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  errorMessage.value = `${err.message} (${info})`
  reportToMonitor(err, info) // 上报监控
  return false // 阻断传播，整页不崩
})
```

拿到错误后渲染一个兜底 UI，而不是让 Vue 直接罢工：

```html
<div v-if="errorMessage" class="app-fallback">
  <p>页面开小差了，部分功能暂时不可用</p>
  <button type="button" @click="errorMessage = ''">重试</button>
</div>
<RouterView v-else />
```

> 错误处理的目标不是消灭报错，而是让报错的爆炸半径可控。

## 配套动作：环境探测全部封装

另一类白屏源头是环境探测类 API。沙箱、老浏览器、爬虫环境里 matchMedia 和 IntersectionObserver 可能不存在，直接调用会抛错并中断整个脚本块——后面所有代码全不执行。全部封装成降级版本：

```ts
export function safeMatchMedia(query: string): MediaQueryList | null {
  if (typeof window.matchMedia !== 'function') return null
  try {
    return window.matchMedia(query)
  } catch {
    return null
  }
}
```

调用方拿到 null 就走兜底分支：系统主题探测失败就默认浅色，观察器不存在就直接加载图片。功能降级，永不中断。

## 验证方式

冒烟测试里专门有一项：监听 jsdom 的 window error 事件，整页跑完不允许有未捕获报错。兜底逻辑没有测试护航，迟早被后续重构悄悄拆掉。
