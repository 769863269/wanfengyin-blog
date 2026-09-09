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

/** App 深链协议白名单（阿里卖家中心等客户端深链）；javascript:/vbscript:/data: 永远不在列，杜绝注入 */
const APP_SCHEMES = ['aicenter']

/** 链接白名单：http(s) / 站内相对路径 / 页内锚点 / mailto / APP_SCHEMES 深链，其余原样返回不生成 a 标签 */
function safeHref(href) {
  const url = href.replaceAll('&amp;', '&')
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(url)) return escapeHtml(url)
  if (APP_SCHEMES.some((s) => url.toLowerCase().startsWith(s + ':'))) return escapeHtml(url)
  return null
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
      blocks.push({ type: 'image', src: image[2], alt: image[1] })
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
        default:
          return ''
      }
    })
    .join('\n')
}
