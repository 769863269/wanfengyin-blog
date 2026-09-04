---
slug: github-actions-auto-deploy
title: github-actions-自动部署
excerpt: git push 之后的一切自动完成：类型检查、单测、构建、预渲染、发布。CI 配置逐行讲解。
publishedAt: 2026-06-25
views: 1268
commentCount: 10
tags: [部署, 工具]
featured: false
---

部署这种事，手动做第三次就该写脚本了。

## 流水线设计

push 触发：装依赖 → 类型检查 → 单测 → 构建（含预渲染和 sitemap）→ 发布产物。任何一步红了，部署不会发生：

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci

      - run: npm run type-check
      - run: npm run lint
      - run: npm test
      - run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

npm ci 而不是 npm install：严格按 lockfile 装，环境绝对可复现。

## 顺序有讲究

便宜的检查放前面。lint 十秒、类型检查三十秒、单测一分钟，全过了才轮到两分钟的构建。反过来排，每次红都要白等构建。

> CI 的价值不是快，是「坏东西绝对上不了线」。

## 缓存

actions/setup-node 的 cache: npm 一行，把依赖安装从两分钟压到十几秒，整体构建时间从三分钟到五十秒。这是性价比最高的一行配置。

## 踩坑

Node 版本锁死在 .nvmrc，流水线用 node-version-file 读取。本地能跑线上挂，八成是环境漂移，版本锁死能消掉一大半这类问题。

另一个坑是产物路径：预渲染脚本在 postbuild 钩子里跑，如果发布步骤拿错目录（拿了 dist 上层），页面能打开但全是 404。发布前先本地把 dist 目录完整过一遍，CI 只复制本地验证过的流程。
