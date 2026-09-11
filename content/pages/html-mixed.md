---
title: HTML 片段 · Markdown 混排
description: 测试 HTML 块与 Markdown 段落、列表、引用、代码块交错渲染
directAccess: true
---

HTML 块最大的价值是和 Markdown **交错混排**，这一页专测衔接。

## 段落 → HTML → 段落

Markdown 开头段。

<div style="background:#e8f2ff; border-radius:14px; padding:18px 20px; margin:16px 0; color:#003d7a;">
  <p style="margin:0;"><strong>提示卡：</strong>这是一个 HTML 块，紧贴前后两个 Markdown 段落。</p>
</div>

Markdown 收尾段，加粗、斜体、`代码` 齐活。

## 列表 → HTML → 引用

- 列表项一
- 列表项二

<figure style="margin:16px 0; padding:16px 20px; background:#f5f5f7; border-left:4px solid #0071e3; border-radius:0 12px 12px 0;">
  <figcaption style="color:#6e6e73; font-size:13px;">figure + figcaption：语义标签测试</figcaption>
</figure>

> 引用块紧随其后，应正常渲染。

## 代码块不受影响

```ts
const html = '<div style="color:red">代码块里的 HTML 是字符串，不是真 HTML</div>'
```

代码块里的 `<div>` 应原样高亮显示，**不会**被当成 HTML 块解析。

## span 行内混排

这是一段 Markdown，中间嵌 <span style="background:#fff3cd; padding:2px 8px; border-radius:6px;">行首白名单标签开启的行内 span</span>——注意它独立成块了（span 也算块入口），样式应生效。

## 结尾

再一个普通段落收尾，验证没有内容被吞。
