/**
 * 构建期代码高亮（Shiki）
 *
 * 设计要点：
 *   - 高亮发生在构建时（Node 端），浏览器不加载任何高亮库，零运行时成本；
 *   - 输出为「code 标签内部 HTML」字符串，交由 blocksToHtml / ArticleBody
 *     包上统一的 pre.article-body__code 外壳，样式完全收口；
 *   - 代码块保持站点一贯的深底设计，token 配色用 github-dark，浅色主题下
 *     深底代码块与站点风格同样成立；
 *   - 未收录的语言或 Shiki 加载失败时静默降级为纯文本，绝不阻断构建。
 */
import { escapeHtml } from './markdown.mjs'

/** 覆盖博客现有文章涉及的全部语言；新增语言后在此补充即可 */
const LANGS = ['ts', 'js', 'vue', 'css', 'scss', 'html', 'json', 'yaml', 'md', 'bash', 'shell', 'diff', 'text']

const THEME = 'github-dark'

let highlighterPromise = null

function getHighlighter() {
  highlighterPromise ??= import('shiki')
    .then(({ createHighlighter }) => createHighlighter({ themes: [THEME], langs: LANGS }))
    .catch((error) => {
      console.warn('[highlight] Shiki 初始化失败，代码块降级为纯文本:', error.message)
      highlighterPromise = null
      return null
    })
  return highlighterPromise
}

/**
 * 代码文本 → <code> 内部 HTML（含高亮 span）。
 * 返回 null 表示降级为纯文本（调用方用 escapeHtml 自行渲染）。
 */
export async function highlightToCodeHtml(code, lang) {
  const highlighter = await getHighlighter()
  if (!highlighter) return null

  const language = LANGS.includes(lang) ? lang : 'text'
  try {
    const html = highlighter.codeToHtml(code, { lang: language, theme: THEME })
    // Shiki 输出 <pre class="shiki ..." style="..."><code>...</code></pre>，
    // 剥掉外壳只留 code 内部 —— 外壳由渲染层统一提供（背景/圆角/复制按钮）。
    const inner = html.replace(/^<pre[^>]*>/, '').replace(/<\/pre>$/, '')
    // Shiki 的 code 标签无属性，去掉多余的 <code></code> 包装层由调用方补
    return inner.replace(/^<code>/, '').replace(/<\/code>$/, '')
  } catch {
    return null
  }
}

/** 纯文本兜底：与 highlightToCodeHtml 返回值同构 */
export function plainCodeHtml(code) {
  return escapeHtml(code)
}
