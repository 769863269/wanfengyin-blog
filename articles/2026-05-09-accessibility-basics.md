---
slug: accessibility-basics
title: 无障碍那点事
excerpt: 键盘用户和读屏用户不是少数派幻想。给博客补无障碍细节的记录。
publishedAt: 2026-05-09
views: 689
commentCount: 4
tags: [随笔, CSS]
featured: false
---

给博客过了一遍无障碍，改完之后整个产品的「完成度」上了一个台阶。

## 改了什么

跳转链接让键盘用户直达正文，不用挨个 Tab 过导航：

```html
<a class="skip-link" href="#main">跳到主要内容</a>
<main id="main" tabindex="-1">
  <!-- 文章内容 -->
</main>
```

交互按钮补齐 aria-label。图标按钮尤其重灾区，读屏软件只会念出空空如也：

```html
<!-- 读屏用户听到的只有「按钮」，等于没有 -->
<button class="theme-toggle">🌙</button>

<!-- 至少告诉他这是个什么按钮 -->
<button class="theme-toggle" aria-label="切换夜间模式">🌙</button>
```

弹窗和抽屉的焦点管理要做闭环：打开时把焦点移进去，关闭时归还给触发按钮，不然键盘用户的焦点会掉回页面开头。

## 列表语义的坑

顺手修了一个自己埋的雷：列表页标题原来用 h1，一页出现十几个 h1，读屏软件的标题大纲直接报废。列表项统一降级为 h2，页面级 h1 只留给详情页标题。

```html
<!-- 错误：一页多个 h1 -->
<h1 class="post-card__title">{{ post.title }}</h1>

<!-- 正确：列表用 h2，时间交给 time 标签 -->
<h2 class="post-card__title">{{ post.title }}</h2>
<time :datetime="post.publishedAt">{{ relativeTime }}</time>
```

> 无障碍不是慈善，是把「能用的产品」变成「好用的产品」。

## 顺手修的

对比度不足的灰色文字全部加深一档，读屏模式和夜间模式都受益，视觉上反而更精致。对比度是设计问题，不只是合规问题。
