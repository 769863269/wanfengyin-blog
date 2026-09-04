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
 *   普通段落
 *
 * 输出为结构化 ArticleBlock 而非 HTML 字符串 —— 与 ArticleBody.vue 的
 * 渲染约定一致，从根上杜绝 XSS。
 */

/** HTML 转义（预渲染输出使用；结构化路径不需要） */
export function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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
 */
export function markdownToBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraphLines = []

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
      paragraphLines = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      continue
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      blocks.push({ type: 'heading', text: heading[2].trim() })
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
          return `<p>${escapeHtml(block.text)}</p>`
        case 'heading':
          return `<h2 class="article-body__heading">${escapeHtml(block.text)}</h2>`
        case 'quote':
          return `<blockquote class="article-body__quote">${escapeHtml(block.text)}</blockquote>`
        case 'image':
          return `<figure class="article-body__figure"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" loading="lazy" decoding="async" /></figure>`
        default:
          return ''
      }
    })
    .join('\n')
}
