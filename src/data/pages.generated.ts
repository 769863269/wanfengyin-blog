/**
 * ⚠️ 本文件由 scripts/build-pages.mjs 自动生成，请勿手工编辑。
 *
 * 数据源：content/pages/*.md（Studio 后台「自定义页面」维护）
 * 重新生成：npm run pages（dev / build 前自动执行）
 */
import type { CustomPage } from '@/types'

export const generatedPages: CustomPage[] = [
  {
    "slug": "dome",
    "title": "测试菜单",
    "description": "测试测试当前页面是否可用",
    "body": [
      {
        "type": "paragraph",
        "text": "测试"
      }
    ]
  },
  {
    "slug": "html-mixed",
    "title": "HTML 片段 · Markdown 混排",
    "description": "测试 HTML 块与 Markdown 段落、列表、引用、代码块交错渲染",
    "body": [
      {
        "type": "paragraph",
        "text": "HTML 块最大的价值是和 Markdown **交错混排**，这一页专测衔接。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "段落 → HTML → 段落"
      },
      {
        "type": "paragraph",
        "text": "Markdown 开头段。"
      },
      {
        "type": "html",
        "html": "<div style=\"background:#e8f2ff; border-radius:14px; padding:18px 20px; margin:16px 0; color:#003d7a;\">\n<p style=\"margin:0;\"><strong>提示卡：</strong>这是一个 HTML 块，紧贴前后两个 Markdown 段落。</p>\n</div>"
      },
      {
        "type": "paragraph",
        "text": "Markdown 收尾段，加粗、斜体、`代码` 齐活。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "列表 → HTML → 引用"
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          "列表项一",
          "列表项二"
        ]
      },
      {
        "type": "html",
        "html": "<figure style=\"margin:16px 0; padding:16px 20px; background:#f5f5f7; border-left:4px solid #0071e3; border-radius:0 12px 12px 0;\">\n<figcaption style=\"color:#6e6e73; font-size:13px;\">figure + figcaption：语义标签测试</figcaption>\n</figure>"
      },
      {
        "type": "quote",
        "text": "引用块紧随其后，应正常渲染。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "代码块不受影响"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const html = '<div style=\"color:red\">代码块里的 HTML 是字符串，不是真 HTML</div>'",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> html</span><span style=\"color:#F97583\"> =</span><span style=\"color:#9ECBFF\"> '&#x3C;div style=\"color:red\">代码块里的 HTML 是字符串，不是真 HTML&#x3C;/div>'</span></span>"
      },
      {
        "type": "paragraph",
        "text": "代码块里的 `<div>` 应原样高亮显示，**不会**被当成 HTML 块解析。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "span 行内混排"
      },
      {
        "type": "paragraph",
        "text": "这是一段 Markdown，中间嵌 <span style=\"background:#fff3cd; padding:2px 8px; border-radius:6px;\">行首白名单标签开启的行内 span</span>——注意它独立成块了（span 也算块入口），样式应生效。"
      },
      {
        "type": "heading",
        "id": "sec-5",
        "text": "结尾"
      },
      {
        "type": "paragraph",
        "text": "再一个普通段落收尾，验证没有内容被吞。"
      }
    ]
  },
  {
    "slug": "html-security",
    "title": "HTML 片段 · 净化演示",
    "description": "测试净化器两条路径：块内危险内容丢弃、行首裸标签转义为纯文本",
    "body": [
      {
        "type": "paragraph",
        "text": "这一页故意写入各类危险内容，验证净化器两条防线。每段前面有说明，对照看结果。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "1. 容器内 script 连内容整体丢弃"
      },
      {
        "type": "paragraph",
        "text": "下面这个 div 里藏了 script，净化后应只剩一句话，script 连同弹窗代码完全消失："
      },
      {
        "type": "html",
        "html": "<div style=\"background:#f5f5f7; border-radius:12px; padding:16px 20px; margin:16px 0;\">\n\n<p style=\"margin:0;\">如果你只看到这句话，说明 script 被整体丢弃了。</p>\n</div>"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "2. 行首裸写非白名单标签 → 转义为纯文本"
      },
      {
        "type": "paragraph",
        "text": "script / img / a 不算块入口标签，行首裸写时不会开启 HTML 块，而是按普通段落**整体转义显示为字面文本**（能看见源码、绝不会被解析执行）："
      },
      {
        "type": "paragraph",
        "text": "<script>alert('裸 script 测试')</script>"
      },
      {
        "type": "paragraph",
        "text": "上面那行应该显示为灰字源码，而不是执行弹窗。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "3. 容器内 javascript: 链接被拦截"
      },
      {
        "type": "html",
        "html": "<div style=\"border:1px solid #d2d2d7; border-radius:12px; padding:16px 20px; margin:16px 0;\">\n<p style=\"margin:0;\"><a style=\"color:#0071e3;\">这个链接的 javascript: href 应被剥掉</a>（点不动、不弹窗）</p>\n</div>"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "4. 保留 id 冲突保护"
      },
      {
        "type": "html",
        "html": "<div style=\"border:2px dashed #ff3b30; border-radius:12px; padding:16px; margin:16px 0;\">我的 id 本想顶掉 Vue 挂载点，应被剥除（页面没白屏就对了）</div>"
      },
      {
        "type": "html",
        "html": "<div style=\"border:2px dashed #ff9500; border-radius:12px; padding:16px; margin:16px 0;\">同上，数据块 id 也应被剥除</div>"
      },
      {
        "type": "heading",
        "id": "sec-5",
        "text": "5. 外链自动补 rel"
      },
      {
        "type": "html",
        "html": "<div style=\"margin:16px 0;\">\n<p style=\"margin:0;\"><a href=\"https://example.com\" target=\"_blank\" style=\"color:#0071e3;\" rel=\"noopener noreferrer\">这个新窗口链接应自动补上 rel=\"noopener noreferrer\"</a></p>\n</div>"
      },
      {
        "type": "paragraph",
        "text": "页面能正常渲染到这一行 = 两条净化路径全部兜住了。"
      }
    ]
  },
  {
    "slug": "html-showcase",
    "title": "HTML 片段 · 版式演示",
    "description": "测试块级 HTML 片段：内联 style 卡片、表格、标题归一",
    "body": [
      {
        "type": "paragraph",
        "text": "这是普通 Markdown 段落，下面直接写块级 HTML 搭版式。"
      },
      {
        "type": "html",
        "html": "<div style=\"background:#f5f5f7; border-radius:18px; padding:28px 24px; text-align:center; margin:20px 0;\">\n<h2 style=\"margin:0 0 8px;\">英雄区标题（h1 应被归一为 h2）</h2>\n<p style=\"margin:0; color:#6e6e73; font-size:15px;\">灰底圆角大卡，内联 style 直接生效</p>\n</div>"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "双卡布局"
      },
      {
        "type": "html",
        "html": "<div style=\"display:flex; gap:16px; margin:20px 0;\">\n<div style=\"flex:1; background:#ffffff; border:1px solid #d2d2d7; border-radius:14px; padding:20px;\">\n<p style=\"margin:0 0 6px; font-weight:600;\">卡片一</p>\n<p style=\"margin:0; color:#6e6e73; font-size:14px;\">左边这张，纯 HTML + 内联样式</p>\n</div>\n<div style=\"flex:1; background:#ffffff; border:1px solid #d2d2d7; border-radius:14px; padding:20px;\">\n<p style=\"margin:0 0 6px; font-weight:600;\">卡片二</p>\n<p style=\"margin:0; color:#6e6e73; font-size:14px;\">右边这张，flex 布局测试</p>\n</div>\n</div>"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "表格"
      },
      {
        "type": "html",
        "html": "<table style=\"width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;\">\n<tr style=\"background:#f5f5f7;\">\n<th style=\"text-align:left; padding:10px 12px; border-bottom:1px solid #d2d2d7;\">能力</th>\n<th style=\"text-align:left; padding:10px 12px; border-bottom:1px solid #d2d2d7;\">状态</th>\n</tr>\n<tr>\n<td style=\"padding:10px 12px; border-bottom:1px solid #e8e8ed;\">内联 style</td>\n<td style=\"padding:10px 12px; border-bottom:1px solid #e8e8ed;\">保留</td>\n</tr>\n<tr>\n<td style=\"padding:10px 12px; border-bottom:1px solid #e8e8ed;\">class 属性</td>\n<td style=\"padding:10px 12px; border-bottom:1px solid #e8e8ed;\">保留</td>\n</tr>\n<tr>\n<td style=\"padding:10px 12px;\">on* 事件属性</td>\n<td style=\"padding:10px 12px;\">丢弃</td>\n</tr>\n</table>"
      },
      {
        "type": "paragraph",
        "text": "HTML 后面接回 Markdown：**加粗**、`行内代码`、[链接](/) 都应正常渲染。"
      }
    ]
  }
]
