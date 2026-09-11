---
title: HTML 片段 · 净化演示
description: 测试净化器两条路径：块内危险内容丢弃、行首裸标签转义为纯文本
directAccess: true
---

这一页故意写入各类危险内容，验证净化器两条防线。每段前面有说明，对照看结果。

## 1. 容器内 script 连内容整体丢弃

下面这个 div 里藏了 script，净化后应只剩一句话，script 连同弹窗代码完全消失：

<div style="background:#f5f5f7; border-radius:12px; padding:16px 20px; margin:16px 0;">
  <script>alert('块内 script 测试')</script>
  <p style="margin:0;">如果你只看到这句话，说明 script 被整体丢弃了。</p>
</div>

## 2. 行首裸写非白名单标签 → 转义为纯文本

script / img / a 不算块入口标签，行首裸写时不会开启 HTML 块，而是按普通段落**整体转义显示为字面文本**（能看见源码、绝不会被解析执行）：

<script>alert('裸 script 测试')</script>

上面那行应该显示为灰字源码，而不是执行弹窗。

## 3. 容器内 javascript: 链接被拦截

<div style="border:1px solid #d2d2d7; border-radius:12px; padding:16px 20px; margin:16px 0;">
  <p style="margin:0;"><a href="javascript:alert('xss')" style="color:#0071e3;">这个链接的 javascript: href 应被剥掉</a>（点不动、不弹窗）</p>
</div>

## 4. 保留 id 冲突保护

<div id="app" style="border:2px dashed #ff3b30; border-radius:12px; padding:16px; margin:16px 0;">我的 id 本想顶掉 Vue 挂载点，应被剥除（页面没白屏就对了）</div>

<div id="post-body-data" style="border:2px dashed #ff9500; border-radius:12px; padding:16px; margin:16px 0;">同上，数据块 id 也应被剥除</div>

## 5. 外链自动补 rel

<div style="margin:16px 0;">
  <p style="margin:0;"><a href="https://example.com" target="_blank" style="color:#0071e3;">这个新窗口链接应自动补上 rel="noopener noreferrer"</a></p>
</div>

页面能正常渲染到这一行 = 两条净化路径全部兜住了。
