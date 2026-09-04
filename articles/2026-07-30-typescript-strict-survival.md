---
slug: typescript-strict-survival
title: typescript-strict-生存指南
excerpt: strict 全开 + noUncheckedIndexedAccess，编译器替你抓住的每一个坑都值得。
cover: /images/covers/typescript-strict-survival.jpg
publishedAt: 2026-07-30
views: 1754
commentCount: 16
tags: [TypeScript]
featured: false
---

TS 开 strict 是痛一时爽一时的投资：开着难受，关了后悔。

## 为什么全开

strict 模式会在编译期抓住大量「运行时才炸」的问题：可能为 undefined 的索引访问、漏判的分支、隐式 any。项目的 tsconfig 就两行核心：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

> 类型系统的收益和严格程度成正比。半开等于没开。

## noUncheckedIndexedAccess：最狠也最值

开了它，所有数组索引访问的返回类型都带一个 undefined 可能性：

```ts
const posts: Post[] = getAllPosts()
const first = posts[0]
// 类型是 Post | undefined，不判空不让用

if (first) {
  console.log(first.title) // 这里才安全
}
```

刚开的时候满屏报错很崩溃，但每一个报错都对应一个真实的「数组越界」潜在事故。查 findById 这类函数时尤其值——查找失败返回 undefined 而不是抛错的约定，配上这个开关，整个数据层的健壮性上了一个台阶。

## 实战三件套

第一是收窄。unknown 比 any 诚实，配合类型守卫逐步收窄：

```ts
function isPost(value: unknown): value is Post {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Post).slug === 'string'
  )
}
```

第二是别骗编译器。as 断言每用一个都要问自己：这是「我比编译器多知道信息」还是「我不想处理类型错误」？后者迟早炸。

第三是让 undefined 参与设计。可选字段用 ? 声明，查找函数返回值带 undefined，调用方自然会被编译器逼着处理空态。

## 迁移建议

存量项目别一口气全开。先开 strict 基础项修干净，再开 noUncheckedIndexedAccess 单独修一轮。报错最多的一天修了四十多处，其中至少五处是真 bug——编译器替你抓住的每一个坑都值得。
