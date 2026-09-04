---
slug: typescript-strict-survival
title: typescript-strict-生存指南
excerpt: strict 全开 + noUncheckedIndexedAccess，编译器替你抓住的每一个坑都值得。
cover: linear-gradient(135deg,#4facfe,#00f2fe)
publishedAt: 2026-07-30
views: 1754
commentCount: 16
tags: [TypeScript]
featured: false
---

TS 开 strict 是痛一时爽一时的投资。
## 为什么全开
strict 模式会在编译期抓住大量「运行时才炸」的问题：可能为 undefined 的索引访问、漏判的分支、隐式 any。开着难受，关了后悔。
> 类型系统的收益和严格程度成正比。
## 实战感受
noUncheckedIndexedAccess 最狠也最值：所有数组索引访问都必须判空。配合「查找失败返回 undefined 而不是抛错」的约定，整个数据层的健壮性上了一个台阶。
