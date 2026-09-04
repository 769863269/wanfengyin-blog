---
slug: css-grid-82-layout
title: css-grid-八二布局
excerpt: 主内容 8 份、侧栏 2 份的经典博客布局，用 Grid 三行搞定，附响应式收窄方案。
cover: /images/covers/css-grid-82-layout.jpg
publishedAt: 2026-08-15
views: 986
commentCount: 9
tags: [CSS]
featured: false
---

博客的 8:2 双栏布局，float 时代要写一堆清除，flex 时代要算比例，Grid 时代三行。

## 实现

```css
.layout {
  display: grid;
  grid-template-columns: 8fr 2fr;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}
```

align-items: start 是细节重点：默认 stretch 会让侧栏被拉伸到和主列一样高，sticky 定位直接失效。设为 start 后两列各按内容收缩，侧栏吸顶才正常。

侧栏吸顶也是三行：

```css
.sidebar {
  position: sticky;
  top: 24px;
}
```

> 布局系统的进步，就是把 hack 变成语义。Grid 的 fr 单位描述的是「分配关系」而不是「计算结果」，浏览器自己会算。

## 响应式收窄

断点的原则是内容先妥协，布局后妥协：

```css
/* 992px 以下：侧栏退场，主列占满 */
@media (max-width: 992px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
```

600px 以下再处理卡片内部：缩略图从右侧改为纵向堆叠，摘要放宽到四行。移动端的卡片反而更完整，因为没有并排空间压力。

## 为什么不用 flex

flex 也能做 8:2（flex: 8 和 flex: 2），但两栏独立对齐、sticky、以及后续可能加的第三栏，Grid 都更自然。单行内容排列用 flex，二维布局用 Grid，这个分工清楚之后选择困难症就消失了。
