---
title: HTML 片段 · 版式演示
description: 测试块级 HTML 片段：内联 style 卡片、表格、标题归一
directAccess: true
---

这是普通 Markdown 段落，下面直接写块级 HTML 搭版式。

<div style="background:#f5f5f7; border-radius:18px; padding:28px 24px; text-align:center; margin:20px 0;">
  <h1 style="margin:0 0 8px;">英雄区标题（h1 应被归一为 h2）</h1>
  <p style="margin:0; color:#6e6e73; font-size:15px;">灰底圆角大卡，内联 style 直接生效</p>
</div>

## 双卡布局

<div style="display:flex; gap:16px; margin:20px 0;">
  <div style="flex:1; background:#ffffff; border:1px solid #d2d2d7; border-radius:14px; padding:20px;">
    <p style="margin:0 0 6px; font-weight:600;">卡片一</p>
    <p style="margin:0; color:#6e6e73; font-size:14px;">左边这张，纯 HTML + 内联样式</p>
  </div>
  <div style="flex:1; background:#ffffff; border:1px solid #d2d2d7; border-radius:14px; padding:20px;">
    <p style="margin:0 0 6px; font-weight:600;">卡片二</p>
    <p style="margin:0; color:#6e6e73; font-size:14px;">右边这张，flex 布局测试</p>
  </div>
</div>

## 表格

<table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
  <tr style="background:#f5f5f7;">
    <th style="text-align:left; padding:10px 12px; border-bottom:1px solid #d2d2d7;">能力</th>
    <th style="text-align:left; padding:10px 12px; border-bottom:1px solid #d2d2d7;">状态</th>
  </tr>
  <tr>
    <td style="padding:10px 12px; border-bottom:1px solid #e8e8ed;">内联 style</td>
    <td style="padding:10px 12px; border-bottom:1px solid #e8e8ed;">保留</td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border-bottom:1px solid #e8e8ed;">class 属性</td>
    <td style="padding:10px 12px; border-bottom:1px solid #e8e8ed;">保留</td>
  </tr>
  <tr>
    <td style="padding:10px 12px;">on* 事件属性</td>
    <td style="padding:10px 12px;">丢弃</td>
  </tr>
</table>

HTML 后面接回 Markdown：**加粗**、`行内代码`、[链接](/) 都应正常渲染。
