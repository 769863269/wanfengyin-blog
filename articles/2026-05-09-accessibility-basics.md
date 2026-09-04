---
slug: accessibility-basics
title: 无障碍那点事
excerpt: 键盘用户和读屏用户不是少数派幻想。给博客补无障碍细节的记录。
cover: linear-gradient(135deg,#fdcbf1,#e6dee9)
publishedAt: 2026-05-09
views: 689
commentCount: 4
tags: [随笔, CSS]
featured: false
---

给博客过了一遍无障碍，改完之后整个产品的「完成度」上了一个台阶。
## 改了什么
跳转链接让键盘用户直达正文；交互按钮补齐 aria-label；焦点管理在弹窗和抽屉里做闭环——打开时聚焦输入框，关闭时归还焦点。
> 无障碍不是慈善，是把「能用的产品」变成「好用的产品」。
## 顺手修的
对比度不足的灰色文字全部加深一档，读屏模式和夜间模式都受益，视觉上反而更精致。
