---
slug: is-rss-dead
title: RSS-过时了吗
excerpt: 大众不用 RSS，但你的核心读者在用。独立博客最后的「关注」通道，值得认真做。
publishedAt: 2026-07-11
views: 742
commentCount: 14
tags: [随笔]
featured: false
---

常有人说 RSS 死了。大众用户确实不用，但这话对独立博客不成立。

## 为什么做

博客没有推送算法，读者看完走了大概率不再回来。RSS 是唯一让读者「订阅」你的机制：订阅器帮他盯着更新，有新文章自动送到面前。订阅者属于你的域名，不经过任何平台。

> 平台的粉丝是租的，RSS 订阅者是自己的。

## 做法零成本

feed.xml 在构建时从文章数据自动生成，标准 RSS 2.0 格式加 atom:link 声明：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>晚风吟</title>
    <link>https://example.com/</link>
    <description>个人开发博客</description>
    <atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>vite8-rolldown-迁移实录</title>
      <link>https://example.com/post/vite8-rolldown-migration/</link>
      <pubDate>Sun, 30 Aug 2026 00:00:00 GMT</pubDate>
      <description>Vite 8 换用 Rolldown 构建引擎的迁移记录。</description>
    </item>
  </channel>
</rss>
```

新文章自动进流，零维护成本，被动收益。XML 里的特殊字符记得转义，正文摘要里的 & 和 < 不处理会直接打挂整个 feed。

## 页面上留入口

head 里声明 feed 地址，阅读器能自动发现：

```html
<link rel="alternate" type="application/rss+xml" title="晚风吟" href="/feed.xml" />
```

页脚再放一个可见入口。别高估读者的主动寻找能力，也别低估 RSS 用户的忠诚度——他们往往是把内容真当回事的那批人。

## 结论

RSS 不需要「复兴」，它只是从大众退成了小众。而小众里恰好住着独立博客的核心读者。一个下午的配置换一条永久的分发渠道，这买卖划算。
