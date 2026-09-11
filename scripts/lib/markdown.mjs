/**
 * Markdown → 文章数据 转换核心
 *
 * 两个消费方：
 *   1. scripts/build-posts.mjs  —— 构建时把 articles/*.md 转成 posts.generated.ts
 *   2. scripts/prerender.mjs    —— 构建后把 blocks 渲染为静态 HTML（SEO 预渲染）
 *
 * 支持的语法（博客够用，刻意保持克制）：
 *   # / ## / ###      标题（统一渲染为 h2 语义）
 *   > 引文
 *   ![alt](src)       图片（独占一行）
 *   * / - / + 条目    无序列表（连续行合并；缩进两格起为上一条目的子列表）
 *   1. / 1) 条目      有序列表（连续行合并）
 *   | a | b | 表格    （下一行为 |---|---| 分隔行）
 *   **粗体** *斜体* ~~删除~~ `行内代码` [文字](链接)   行内格式
 *   ```lang 围栏代码块（``` 结束；未闭合时取到文末）
 *   普通段落
 *   块级 HTML 片段    <div class="…">…</div>（白名单净化，可带内联 style）
 *
 * 输出为结构化 ArticleBlock 而非 HTML 字符串 —— 与 ArticleBody.vue 的
 * 渲染约定一致，从根上杜绝 XSS。
 * 行内格式经 renderInline 输出「先整体转义、再挂白名单标签」的受控 HTML，
 * 与构建期 Shiki codeHtml 同一信任级别，渲染端可安全 v-html。
 */

/** HTML 转义（预渲染输出使用；结构化路径不需要） */
export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * 链接安全：符合 Markdown 语义 —— 任何 []() 都生成 a 标签，
 * 仅拦截危险协议（javascript:/vbscript:/data: 是 XSS 注入载体，绝不能变成可点链接）。
 * 协议判断前剔除空白与制表符（浏览器解析 href 时会忽略它们，java\tscript: 也要拦住）。
 */
const UNSAFE_SCHEMES = ['javascript:', 'vbscript:', 'data:']

function safeHref(href) {
  const url = href.replaceAll('&amp;', '&').trim()
  const probe = url.toLowerCase().replaceAll(/\s+/g, '')
  if (UNSAFE_SCHEMES.some((s) => probe.startsWith(s))) return null
  return escapeHtml(url)
}

/**
 * 独占一行图片的地址白名单。
 *
 * 结构化 block 的 src 最终由模板直接绑定到 <img src>（不走 v-html 净化），
 * 所以协议判断必须在这里做 —— 与行内链接的 safeHref 是同一条防线。
 * 只放行站内相对路径与 http(s)：data: / javascript: / vbscript: 一律拒绝
 * （内联 base64 另有构建期门禁直接报错，见 lib/articles.mjs）。
 */
function safeImageSrc(raw) {
  const url = String(raw).trim()
  if (!url) return null
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return url
  const probe = url.toLowerCase().replaceAll(/\s+/g, '')
  if (probe.startsWith('http://') || probe.startsWith('https://')) return url
  return null
}

/* ===================== 块级 HTML 片段 =====================
 *
 * 允许在 Markdown 里直接写块级 HTML，用来搭 Markdown 表达不了的版式
 * （卡片、分栏、徽标、自定义表格样式…），并且可以带内联 style。
 *
 * 安全模型与行内格式完全一致 —— **生成端白名单 + 渲染端 DOMPurify 双层**：
 *   1. 生成端 sanitizeHtmlBlock 在解析期就把原始 HTML 过一遍白名单，
 *      所以写进 posts.body.generated.ts / pages.generated.ts 的已经是干净内容，
 *      预渲染（prerender.mjs → blocksToHtml）直接输出也不会带进危险标记。
 *   2. 渲染端 ArticleBody.vue 仍走 sanitizeHtml（DOMPurify），
 *      即使将来生成端被绕过，危险内容也会在这里被剥离。
 *
 * 下面两个数组是**唯一来源**，sanitize.ts 直接 import —— 预渲染产物与客户端
 * hydration 的保留集合必须一致，不一致会导致水合前后 DOM 跳变。
 *
 * ⚠️ 硬边界：CSP 的 script-src 是 'self'，内联 <script> 由浏览器直接拒绝执行；
 *    本模块也把 script / style / iframe 等标签连同内容整体剥离。
 *    HTML 片段只能表达静态结构与样式，不能携带行为。
 */

/** HTML 片段可用的标签 */
export const HTML_TAG_ALLOWLIST = [
  'a', 'b', 'blockquote', 'br', 'caption', 'code', 'del', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark',
  'ol', 'p', 'pre', 's', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td',
  'th', 'thead', 'tr', 'u', 'ul',
]

/**
 * HTML 片段可用的属性。
 * style 显式放行（CSP 本就允许内联样式），值另经 safeStyleValue 过滤；
 * width / height 让 img 能按原始尺寸展示。
 */
export const HTML_ATTR_ALLOWLIST = [
  'alt', 'class', 'colspan', 'decoding', 'height', 'href', 'id', 'loading', 'rel',
  'rowspan', 'src', 'srcset', 'style', 'target', 'title', 'width',
]

/** 连同内容一起丢弃：留着标签就等于留下执行面或外链面 */
const HTML_DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form',
  'input', 'button', 'textarea', 'select', 'option', 'svg', 'math', 'template',
  'noscript', 'frame', 'frameset', 'applet',
])

/** 自闭合标签：没有闭合标签，不参与配平 */
const HTML_VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

/** 页面自身占用的 id：用户写了会顶掉 Vue 挂载点或预渲染数据块 */
const HTML_RESERVED_IDS = new Set(['app', 'post-body-data'])

/** 文本节点转义：只转尖括号，已写好的 HTML 实体不重复转义 */
function escapeHtmlText(text) {
  return String(text)
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]{0,10}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});)/g, '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

/** 拆分标签内部文本（已去掉首尾尖括号）；注释 / DOCTYPE / 处理指令返回 null */
function parseHtmlTag(inner) {
  const text = inner.trim()
  if (!text || text.startsWith('!') || text.startsWith('?')) return null
  const closing = text.startsWith('/')
  const rest = closing ? text.slice(1).trimStart() : text
  const m = rest.match(/^([a-zA-Z][a-zA-Z0-9:-]*)/)
  if (!m) return null
  const tail = rest.slice(m[1].length)
  return {
    name: m[1].toLowerCase(),
    closing,
    selfClosing: /\/\s*$/.test(tail),
    attrs: tail.replace(/\/\s*$/, ''),
  }
}

/** URL 属性值：与行内链接同口径，拦 javascript / vbscript / data */
function safeAttrUrl(raw) {
  const value = String(raw)
  if (value.includes('<') || value.includes('>')) return null
  const probe = value.toLowerCase().replace(/[\s\u0000-\u001f]/g, '')
  const hit = probe.split(',').some((part) => UNSAFE_SCHEMES.some((s) => part.startsWith(s)))
  return hit ? null : value
}

/**
 * style 值：挡掉表达式、脚本协议、@import，以及站外的 url()。
 * url() 只放行 https 与站内相对路径 —— 与 public/_headers 的 img-src
 * （'self' data: blob: https:，不含 http:）口径一致，避免写出必然被 CSP 拦的地址。
 */
function safeStyleValue(raw) {
  const value = String(raw)
  if (/[<>\\]/.test(value)) return null
  if (/expression\s*\(|javascript:|vbscript:|behavior\s*:|@import|binding\s*:/i.test(value)) return null
  if (/url\s*\(\s*['"]?\s*(?!https:\/\/|\/|\.\.?\/)/i.test(value)) return null
  return value
}

/** 属性列表：只保留白名单项，值重新转义 */
function sanitizeHtmlAttrs(tagName, attrText) {
  const kept = []
  let i = 0
  while (i < attrText.length) {
    while (i < attrText.length && /\s/.test(attrText[i])) i++
    if (i >= attrText.length) break
    const nameStart = i
    while (i < attrText.length && !/[\s=]/.test(attrText[i])) i++
    const name = attrText.slice(nameStart, i).toLowerCase()
    if (!name) {
      i++
      continue
    }
    while (i < attrText.length && /\s/.test(attrText[i])) i++
    let value = ''
    if (attrText[i] === '=') {
      i++
      while (i < attrText.length && /\s/.test(attrText[i])) i++
      const quote = attrText[i]
      if (quote === '"' || quote === "'") {
        i++
        const end = attrText.indexOf(quote, i)
        value = end < 0 ? attrText.slice(i) : attrText.slice(i, end)
        i = end < 0 ? attrText.length : end + 1
      } else {
        const valueStart = i
        while (i < attrText.length && !/\s/.test(attrText[i])) i++
        value = attrText.slice(valueStart, i)
      }
    }
    if (!HTML_ATTR_ALLOWLIST.includes(name)) continue
    if (name.startsWith('on')) continue // 事件处理器属性：CSP 会拦，但更该在这里就丢掉
    if (name === 'style') {
      const ok = safeStyleValue(value)
      if (ok === null) continue
      value = ok
    }
    if (name === 'href' || name === 'src' || name === 'srcset') {
      const ok = safeAttrUrl(value)
      if (ok === null) continue
      value = ok
    }
    if (name === 'id' && HTML_RESERVED_IDS.has(value.trim())) continue
    kept.push([name, value])
  }
  // 新窗口打开的外链补 noopener，与 renderInline 的链接同规则
  const isBlank = kept.some(([n, v]) => n === 'target' && v === '_blank')
  if (tagName === 'a' && isBlank && !kept.some(([n]) => n === 'rel')) {
    kept.push(['rel', 'noopener noreferrer'])
  }
  return kept.map(([n, v]) => n + '="' + escapeHtml(v) + '"').join(' ')
}

/** h1 归一到 h2：页面级 h1 属于标题，正文里再出现会打乱标题大纲 */
function normalizeHtmlTagName(name) {
  return name === 'h1' ? 'h2' : name
}

/**
 * 块级 HTML 净化（生成端；与渲染端 DOMPurify 共用同一份白名单）。
 * 保留白名单标签与属性；script / style / iframe 等连同内容整体丢弃；
 * 未知标签只丢标签、保留其中文字（标签名写错不会让整段内容消失）。
 */
export function sanitizeHtmlBlock(raw) {
  const src = String(raw)
  let out = ''
  let i = 0
  let dropping = null // 正在整体丢弃内容的标签名（script / style / …）

  while (i < src.length) {
    const lt = src.indexOf('<', i)
    if (lt < 0) {
      if (!dropping) out += escapeHtmlText(src.slice(i))
      break
    }
    if (!dropping) out += escapeHtmlText(src.slice(i, lt))

    // 找标签结束位置：引号里的 > 不算结束
    let j = lt + 1
    let quote = null
    while (j < src.length) {
      const ch = src[j]
      if (quote) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") quote = ch
      else if (ch === '>') break
      j++
    }
    if (j >= src.length) {
      // 没闭合的尖括号，按文本处理
      if (!dropping) out += escapeHtmlText(src.slice(lt))
      break
    }

    const inner = src.slice(lt + 1, j)
    i = j + 1

    if (dropping) {
      if (new RegExp('^/\\s*' + dropping + '(?![a-zA-Z0-9-])', 'i').test(inner.trim())) dropping = null
      continue
    }

    const tag = parseHtmlTag(inner)
    if (!tag) continue

    if (tag.closing) {
      if (HTML_TAG_ALLOWLIST.includes(tag.name)) out += '</' + normalizeHtmlTagName(tag.name) + '>'
      continue
    }
    if (HTML_DROP_WITH_CONTENT.has(tag.name)) {
      if (!tag.selfClosing && !HTML_VOID.has(tag.name)) dropping = tag.name
      continue
    }
    if (!HTML_TAG_ALLOWLIST.includes(tag.name)) continue

    const attrs = sanitizeHtmlAttrs(tag.name, tag.attrs)
    out += '<' + normalizeHtmlTagName(tag.name) + (attrs ? ' ' + attrs : '') + (tag.selfClosing ? ' />' : '>')
  }
  return out
}

/**
 * HTML 片段的标签配平状态：判断「块写完了没有」。
 * 注释内的尖括号不参与配平；未闭合的注释视为块未结束。
 */
function htmlBlockState(text) {
  const opens = (text.match(/<!--/g) || []).length
  const closes = (text.match(/-->/g) || []).length
  const stripped = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!--[\s\S]*$/, '')
  let depth = 0
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g
  let m
  while ((m = re.exec(stripped)) !== null) {
    if (m[1] === '/') {
      depth--
      continue
    }
    if (HTML_VOID.has(m[2].toLowerCase()) || /\/\s*$/.test(m[3])) continue
    depth++
  }
  return { depth: Math.max(depth, 0), commentOpen: opens > closes }
}

/**
 * 行内 Markdown → 受控 HTML。
 * 流程：先整体 escapeHtml，再只挂白名单标签（strong/em/del/code/a/img），
 * 任何未识别内容保持转义后的纯文本 —— 不可能注入。
 * 渲染端（ArticleBody.vue v-html / blocksToHtml）共用此函数。
 */
export function renderInline(text) {
  let s = escapeHtml(text)
  const slots = []

  // 行内代码先占位（私用区哨兵，不会出现在正常文本）：内部内容不再参与后续语法匹配
  s = s.replace(/`([^`]+)`/g, (_, code) => {
    slots.push('<code class="article-body__inlinecode">' + code + '</code>')
    return '\uE000' + (slots.length - 1) + '\uE001'
  })

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 行内图片（非独占一行的）
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    const url = safeHref(src)
    return url ? '<img src="' + url + '" alt="' + alt + '" loading="lazy" decoding="async" />' : m
  })

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const url = safeHref(href)
    return url ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : m
  })

  s = s.replace(/\uE000(\d+)\uE001/g, (_, n) => slots[Number(n)] ?? '')
  return s
}

/**
 * 解析 frontmatter（--- 包裹的 YAML 子集）。
 * 只支持「key: value」标量与「key: [a, b]」数组简写，够 frontmatter 使用。
 */
export function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/)

  if (!match) {
    return { data: {}, body: normalized.trim() }
  }

  const data = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue

    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (!key) continue

    // 数组简写：tags: [生活, 随笔]
    const arrayMatch = value.match(/^\[(.*)\]$/)
    if (arrayMatch) {
      data[key] = arrayMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      continue
    }

    // 去除成对引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    data[key] = value
  }

  return { data, body: normalized.slice(match[0].length).trim() }
}

/**
 * Markdown 正文 → ArticleBlock[]
 * 空行分段；连续非空行合并为一个段落。
 * ``` 围栏代码块整体捕获（含空行），lang 记录语言标签。
 * 表格：首行 | a | b |，紧跟分隔行（每格 :--- / --- : 形态），后续连续行数据行。
 * 列表：连续行合并；比首条目缩进 ≥2 格的行归为上一条目的子列表（一层嵌套）。
 */
export function markdownToBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraphLines = []
  let headingCount = 0

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
      paragraphLines = []
    }
  }

  /** 表格行拆格：去首尾竖线后按 | 切 */
  const splitRow = (raw) => {
    let t = raw.trim()
    if (t.startsWith('|')) t = t.slice(1)
    if (t.endsWith('|')) t = t.slice(0, -1)
    return t.split('|').map((c) => c.trim())
  }

  /** 分隔行判定：每个格子都是 :--- / --- : 形态 */
  const isSeparatorRow = (raw) => {
    const cells = splitRow(raw)
    return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
  }

  const rowLine = (raw) => {
    const m = raw.trim().match(/^\|(.+)\|$/)
    return m ? splitRow(m[1]) : null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 代码块开始：```lang ... ```
    const fence = line.match(/^(```+|~~~+)\s*([A-Za-z0-9_-]*)\s*$/)
    if (fence) {
      flushParagraph()
      const closing = fence[1][0] === '`' ? /^`{3,}\s*$/ : /^~{3,}\s*$/
      const codeLines = []
      i++
      while (i < lines.length && !closing.test(lines[i].trim())) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang: fence[2] || 'text', text: codeLines.join('\n') })
      continue
    }

    if (!line) {
      flushParagraph()
      continue
    }

    // HTML 片段块：以白名单块级标签开头，写到「标签配平」或空行为止。
    // 净化在 sanitizeHtmlBlock 里做，此处只负责切出完整的一段。
    const htmlOpen = line.match(/^<([a-zA-Z][a-zA-Z0-9-]*)[\s/>]/)
    if (htmlOpen && HTML_TAG_ALLOWLIST.includes(htmlOpen[1].toLowerCase())) {
      flushParagraph()
      const chunk = []
      while (i < lines.length) {
        const cur = lines[i].trim()
        if (!cur) break
        chunk.push(cur)
        i++
        const state = htmlBlockState(chunk.join('\n'))
        if (state.depth <= 0 && !state.commentOpen) break
      }
      i-- // 退一格，让外层循环的 i++ 落在正确位置
      const clean = sanitizeHtmlBlock(chunk.join('\n'))
      if (clean.trim()) blocks.push({ type: 'html', html: clean })
      continue
    }

    // 表格：首行 | a | b | + 分隔行 |---|---|
    const headCells = rowLine(lines[i])
    if (headCells && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      flushParagraph()
      const rows = []
      i += 2
      while (i < lines.length) {
        const cells = rowLine(lines[i])
        if (!cells || cells.length !== headCells.length) break
        rows.push(cells)
        i++
      }
      i--
      blocks.push({ type: 'table', head: headCells, rows })
      continue
    }

    // 标题（id 供文章目录 TOC 锚点跳转）
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      blocks.push({ type: 'heading', id: `sec-${++headingCount}`, text: heading[2].trim() })
      continue
    }

    // 引文（支持 > 连续行合并）
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'quote') {
        last.text += ' ' + quote[1]
      } else {
        blocks.push({ type: 'quote', text: quote[1] })
      }
      continue
    }

    // 图片（独占一行才算，行内图片不解析）
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (image) {
      flushParagraph()
      const src = safeImageSrc(image[2])
      // 协议不在白名单内：整行降级为纯文本，绝不让危险地址进到 <img src>
      if (src) blocks.push({ type: 'image', src, alt: image[1] })
      else blocks.push({ type: 'paragraph', text: line })
      continue
    }

    // 列表：* / - / + 无序，1. / 1) 有序；连续列表行合并为一个 block，
    // 比首条目缩进 ≥2 格的行作为上一条目的子列表项（支持一层嵌套）
    const listItem = lines[i].match(/^(\s*)([*+-]|\d+[.)])\s+(.+)$/)
    if (listItem) {
      flushParagraph()
      const ordered = /\d/.test(listItem[2])
      const baseIndent = listItem[1].length
      /** @type {Array<string | { text: string; children: string[]; childrenOrdered: boolean }>} */
      const items = [listItem[3].trim()]

      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim()
        const m2 = lines[i + 1].match(/^(\s*)([*+-]|\d+[.)])\s+(.+)$/)
        if (!next || !m2) break
        const ordered2 = /\d/.test(m2[2])
        if (m2[1].length >= baseIndent + 2) {
          // 子列表项：最后一个条目从字符串懒升级为带 children 的对象
          let last = items[items.length - 1]
          if (typeof last === 'string') {
            last = { text: last, children: [], childrenOrdered: ordered2 }
            items[items.length - 1] = last
          }
          last.children.push(m2[3].trim())
        } else if (ordered2 === ordered) {
          items.push(m2[3].trim())
        } else {
          break // 同级但列表类型不同 → 结束本列表，下一轮起新列表
        }
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    paragraphLines.push(line)
  }

  flushParagraph()
  return blocks
}

/** ArticleBlock[] → 静态 HTML（预渲染用，类名对齐 ArticleBody.vue） */
export function blocksToHtml(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${renderInline(block.text)}</p>`
        case 'heading':
          return `<h2 id="${escapeHtml(block.id ?? '')}" class="article-body__heading">${renderInline(block.text)}</h2>`
        case 'quote':
          return `<blockquote class="article-body__quote">${renderInline(block.text)}</blockquote>`
        case 'image':
          return `<figure class="article-body__figure"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" loading="lazy" decoding="async" /></figure>`
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul'
          const cls = block.ordered ? 'article-body__olist' : 'article-body__ulist'
          const lis = block.items
            .map((it) => {
              if (typeof it === 'string') return `<li>${renderInline(it)}</li>`
              const ctag = it.childrenOrdered ? 'ol' : 'ul'
              const ccls = it.childrenOrdered ? 'article-body__olist' : 'article-body__ulist'
              const children = it.children.map((c) => `<li>${renderInline(c)}</li>`).join('')
              return `<li>${renderInline(it.text)}<${ctag} class="${ccls}">${children}</${ctag}></li>`
            })
            .join('')
          return `<${tag} class="${cls}">${lis}</${tag}>`
        }
        case 'table': {
          const thead = `<thead><tr>${block.head.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`
          const tbody = `<tbody>${block.rows
            .map((row) => `<tr>${row.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody>`
          return `<div class="article-body__tablewrap"><table class="article-body__table">${thead}${tbody}</table></div>`
        }
        case 'code':
          // 构建期已高亮（block.codeHtml 为 Shiki 生成的 token span，构建产物可信）；
          // 未高亮的（语言不支持/降级）走纯文本转义
          return `<pre class="article-body__code" data-lang="${escapeHtml(block.lang)}"><code>${block.codeHtml ?? escapeHtml(block.text)}</code></pre>`
        case 'html':
          // 解析期已按白名单净化过（sanitizeHtmlBlock），此处直接输出
          return block.html
        default:
          return ''
      }
    })
    .join('\n')
}
