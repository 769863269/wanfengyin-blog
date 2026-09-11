/**
 * DOMPurify 二道净化层（v-html 统一出口）
 *
 * 分层防御模型：
 *   第一层 renderInline / sanitizeHtmlBlock（scripts/lib/markdown.mjs）——
 *     生成端白名单，只产受控标签；
 *   第二层 DOMPurify —— 渲染端净化，即使第一层被绕过 / 将来改动引入漏洞，
 *     危险内容也会在这里被剥离。OWASP XSS 防治清单推荐的 DOM 净化标准库。
 *
 * ⚠️ 标签与属性白名单**直接复用 markdown.mjs 的导出**，不在这里另写一份：
 * 两份名单一旦漂移，预渲染产物与客户端 hydration 保留的标记就会不同，
 * 页面会出现水合前后的 DOM 跳变（元素忽然丢属性、尺寸变化）。
 *
 * ALLOWED_URI_REGEXP 在默认协议（http/https/ftp/tel/mailto/sms…）基础上
 * 加放 aicenter（阿里卖家中心深链）；javascript:/vbscript:/data: 不在列。
 */
import DOMPurify from 'dompurify'
import { HTML_ATTR_ALLOWLIST, HTML_TAG_ALLOWLIST } from '../../scripts/lib/markdown.mjs'

const URI_RE =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|aicenter):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...HTML_TAG_ALLOWLIST],
    ALLOWED_ATTR: [...HTML_ATTR_ALLOWLIST],
    ALLOWED_URI_REGEXP: URI_RE,
  })
}
