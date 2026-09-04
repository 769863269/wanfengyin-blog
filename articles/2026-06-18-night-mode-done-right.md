---
slug: night-mode-done-right
title: 夜间模式的正确实现
excerpt: 不做暗色分支判断，只换设计令牌。夜间模式从「全文件搜索替换」变成「覆盖一份变量表」。
cover: /images/covers/night-mode-done-right.jpg
publishedAt: 2026-06-18
views: 1687
commentCount: 21
tags: [CSS, Vue]
featured: true
---

夜间模式最常见的实现是在组件里写一堆 .night 分支，结果样式文件比业务代码还难维护，每加一个组件都要把暗色判断抄一遍。

## 令牌方案

所有颜色收敛为 CSS 变量（详见设计令牌那篇），html.night 只覆盖变量表：

```css
html.night {
  --bg-page: #111113;
  --bg-surface: #1c1c1e;
  --text-primary: #f5f5f7;
  --text-secondary: #98989d;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 60%);
}
```

组件里没有一行暗色判断，切主题就是换一层皮。判断逻辑收拢到一处，比散落在十个文件里健康一百倍。

## 偏好初始化的三级策略

主题偏好按优先级读取：localStorage 手动选择优先，没有手动记录就跟随系统 prefers-color-scheme，探测失败兜底浅色：

```ts
const saved = localStorage.getItem('theme')
const prefersDark =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

document.documentElement.classList.toggle('night', saved === 'night' || (!saved && prefersDark))
```

matchMedia 一定要包降级判断：探测 API 不是处处存在，直接调用的代价是整个脚本中断。

## 切换动画只给颜色

切换瞬间全局 transition 会带来灾难：所有元素的位置变化都在做补间。正确做法是根节点加一个短暂的主题过渡类，只让颜色属性参与动画：

```css
html.theme-switching *,
html.theme-switching *::before {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
```

300 毫秒后移除这个类。动画只发生在切换瞬间，平时零开销。

## 防闪烁

深色用户刷新页面时，CSS 加载前的白底闪烁很扎眼。主题类在 head 里用同步脚本写入，赶在首帧渲染之前：

```html
<head>
  <script>
    document.documentElement.classList.toggle(
      'night',
      localStorage.getItem('theme') === 'night',
    )
  </script>
</head>
```

> 夜间模式的完成度，体现在没人注意到它的存在。
