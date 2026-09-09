/**
 * DOMPurify 二道净化层（v-html 统一出口）
 *
 * 分层防御模型：
 *   第一层 renderInline（scripts/lib/markdown.mjs）—— 生成端白名单，只产受控标签；
 *   第二层 DOMPurify —— 渲染端净化，即使第一层被绕过/未来改动引入漏洞，
 *   危险内容也会在这里被剥离。OWASP XSS 防治清单推荐的 DOM 净化标准库。
 *
 * ALLOWED_URI_REGEXP 在默认协议（http/https/ftp/tel/mailto/sms…）基础上
 * 加放 aicenter（阿里卖家中心深链）；javascript:/vbscript:/data: 不在列。
 */
import DOMPurify from 'dompurify'

const URI_RE =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|aicenter):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'blockquote', 'br', 'caption', 'code', 'del', 'div', 'em',
      'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li',
      'mark', 'ol', 'p', 'pre', 's', 'span', 'strong', 'sub', 'sup',
      'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'srcset', 'alt', 'title', 'class', 'id', 'target',
      'rel', 'loading', 'decoding', 'colspan', 'rowspan', 'data-lang',
    ],
    ALLOWED_URI_REGEXP: URI_RE,
  })
}
