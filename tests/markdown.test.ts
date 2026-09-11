import { describe, expect, it } from 'vitest'
import {
  blocksToHtml,
  HTML_ATTR_ALLOWLIST,
  HTML_TAG_ALLOWLIST,
  markdownToBlocks,
  parseFrontmatter,
  renderInline,
  sanitizeHtmlBlock,
} from '../scripts/lib/markdown.mjs'

describe('parseFrontmatter', () => {
  it('解析标量与数组简写', () => {
    const { data, body } = parseFrontmatter(
      '---\ntitle: 标题\ntags: [生活, 随笔]\nfeatured: true\n---\n\n正文内容',
    )
    expect(data.title).toBe('标题')
    expect(data.tags).toEqual(['生活', '随笔'])
    expect(data.featured).toBe('true')
    expect(body).toBe('正文内容')
  })

  it('去除成对引号', () => {
    const { data } = parseFrontmatter('---\ntitle: "带引号"\n---\n')
    expect(data.title).toBe('带引号')
  })

  it('无 frontmatter 时原文返回', () => {
    const { data, body } = parseFrontmatter('直接正文')
    expect(data).toEqual({})
    expect(body).toBe('直接正文')
  })

  it('冒号出现在值里不破坏解析', () => {
    const { data } = parseFrontmatter('---\nexcerpt: 时间: 12:00\n---\n')
    expect(data.excerpt).toBe('时间: 12:00')
  })
})

describe('markdownToBlocks', () => {
  it('标题、段落、引文各归其位', () => {
    const blocks = markdownToBlocks('第一段\n\n## 小标题\n\n第二段\n\n> 引文')
    expect(blocks).toEqual([
      { type: 'paragraph', text: '第一段' },
      { type: 'heading', id: 'sec-1', text: '小标题' },
      { type: 'paragraph', text: '第二段' },
      { type: 'quote', text: '引文' },
    ])
  })

  it('多个标题按顺序编号锚点 id', () => {
    const blocks = markdownToBlocks('## 一\n\n### 二\n\n## 三')
    expect(blocks.map((b) => (b as { id?: string }).id)).toEqual(['sec-1', 'sec-2', 'sec-3'])
  })

  it('连续行合并为同一段落', () => {
    const blocks = markdownToBlocks('第一行\n第二行')
    expect(blocks).toEqual([{ type: 'paragraph', text: '第一行 第二行' }])
  })

  it('连续引文合并', () => {
    const blocks = markdownToBlocks('> 第一句\n> 第二句')
    expect(blocks).toEqual([{ type: 'quote', text: '第一句 第二句' }])
  })

  it('独占一行的图片生成 image block', () => {
    const blocks = markdownToBlocks('前文\n![说明](/img/a.png)\n后文')
    expect(blocks[1]).toEqual({ type: 'image', src: '/img/a.png', alt: '说明' })
  })

  it('图片 src 走协议白名单：放行相对路径与 http(s)', () => {
    expect(markdownToBlocks('![x](./a.png)')[0]).toEqual({ type: 'image', src: './a.png', alt: 'x' })
    expect(markdownToBlocks('![x](../a/b.png)')[0]?.type).toBe('image')
    expect(markdownToBlocks('![x](https://cdn.example.com/a.png)')[0]).toEqual({
      type: 'image',
      src: 'https://cdn.example.com/a.png',
      alt: 'x',
    })
  })

  it('图片 src 危险协议降级为纯文本（不留可加载地址）', () => {
    // block 的 src 由模板直接绑定到 <img src>，不经 v-html 净化，协议判断必须在这里拦
    expect(markdownToBlocks('![x](javascript:alert)')[0]?.type).toBe('paragraph')
    expect(markdownToBlocks('![x](data:image/png;base64,iVBORw0KGgo)')[0]?.type).toBe('paragraph')
    expect(markdownToBlocks('![x](vbscript:msgbox)')[0]?.type).toBe('paragraph')
  })

  it('空输入返回空数组', () => {
    expect(markdownToBlocks('')).toEqual([])
  })

  it('围栏代码块整体捕获，保留内部空行与缩进', () => {
    const blocks = markdownToBlocks('```ts\nconst a = 1\n\nif (a) {\n  log(a)\n}\n```')
    expect(blocks).toEqual([
      { type: 'code', lang: 'ts', text: 'const a = 1\n\nif (a) {\n  log(a)\n}' },
    ])
  })

  it('无语言标注的代码块 lang 为 text', () => {
    const blocks = markdownToBlocks('```\nplain\n```')
    expect(blocks).toEqual([{ type: 'code', lang: 'text', text: 'plain' }])
  })

  it('代码块内部的 # 与 > 不当作语法解析', () => {
    const blocks = markdownToBlocks('```\n# 注释不是标题\n> 也不是引文\n```')
    expect(blocks).toEqual([
      { type: 'code', lang: 'text', text: '# 注释不是标题\n> 也不是引文' },
    ])
  })

  it('未闭合代码块取到文末', () => {
    const blocks = markdownToBlocks('```ts\nconst a = 1')
    expect(blocks).toEqual([{ type: 'code', lang: 'ts', text: 'const a = 1' }])
  })

  it('代码块前后的段落正常分段', () => {
    const blocks = markdownToBlocks('前文\n\n```css\n.a { color: red }\n```\n\n后文')
    expect(blocks).toEqual([
      { type: 'paragraph', text: '前文' },
      { type: 'code', lang: 'css', text: '.a { color: red }' },
      { type: 'paragraph', text: '后文' },
    ])
  })

  it('表格：表头 + 分隔行 + 数据行', () => {
    const blocks = markdownToBlocks(
      '| 阶段 | 主要任务 |\n| --- | --- |\n| 基础建设 | 店铺装修 |\n| 流量增长 | 关键词优化 |',
    )
    expect(blocks).toEqual([
      {
        type: 'table',
        head: ['阶段', '主要任务'],
        rows: [
          ['基础建设', '店铺装修'],
          ['流量增长', '关键词优化'],
        ],
      },
    ])
  })

  it('分隔行不合规则时不当作表格', () => {
    const blocks = markdownToBlocks('| a | b |\n| 不是分隔行 |')
    expect(blocks[0]?.type).toBe('paragraph')
  })

  it('列表子项缩进两格归为父条目子列表', () => {
    const blocks = markdownToBlocks('1. 父条目\n   * 子项甲\n   * 子项乙\n2. 兄弟条目')
    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: true,
        items: [
          { text: '父条目', children: ['子项甲', '子项乙'], childrenOrdered: false },
          '兄弟条目',
        ],
      },
    ])
  })

  it('无子项的普通列表项仍是字符串形态', () => {
    const blocks = markdownToBlocks('* 甲\n* 乙')
    expect(blocks).toEqual([{ type: 'list', ordered: false, items: ['甲', '乙'] }])
  })
})

describe('renderInline', () => {
  it('粗体 / 斜体 / 删除线 / 行内代码', () => {
    expect(renderInline('**加粗** 和 *斜体* 和 ~~删除~~ 和 `code`')).toBe(
      '<strong>加粗</strong> 和 <em>斜体</em> 和 <del>删除</del> 和 <code class="article-body__inlinecode">code</code>',
    )
  })

  it('链接生成 a 标签并带 noopener', () => {
    expect(renderInline('[发布新品](https://example.com/x)')).toBe(
      '<a href="https://example.com/x" target="_blank" rel="noopener noreferrer">发布新品</a>',
    )
  })

  it('非白名单协议的链接不生成 a 标签', () => {
    const html = renderInline('[点我](javascript:alert(1))')
    expect(html).not.toContain('<a ')
    expect(html).toContain('javascript:alert(1)')
  })

  it('markdown 语义：任意 []() 协议都生成链接（aicenter 深链）', () => {
    const html = renderInline('[使用RFQ报价](aicenter://customChat)')
    expect(html).toContain('<a href="aicenter://customChat"')
    expect(html).toContain('>使用RFQ报价</a>')
  })

  it('markdown 语义：ftp 等任意协议也生成链接', () => {
    const html = renderInline('[文件](ftp://files.example.com/a.zip)')
    expect(html).toContain('<a href="ftp://files.example.com/a.zip"')
  })

  it('危险协议变体（空白混淆 java\\tscript:）仍然拦截', () => {
    const html = renderInline('[点我](java\tscript:alert(1))')
    expect(html).not.toContain('<a ')
  })

  it('data: 协议不放行', () => {
    const html = renderInline('[点我](data:text/html,hi)')
    expect(html).not.toContain('<a ')
  })

  it('行内 HTML 被转义，不可能注入', () => {
    const html = renderInline('**<script>alert(1)</script>**')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('<strong>')
  })

  it('行内代码里的星号不参与粗体解析', () => {
    expect(renderInline('`**not bold**`')).toBe(
      '<code class="article-body__inlinecode">**not bold**</code>',
    )
  })
})

describe('块级 HTML 片段', () => {
  it('行首白名单标签开启 html block，跨行捕获到标签配平', () => {
    const blocks = markdownToBlocks('<div class="card">\n  <p>内容</p>\n</div>\n\n后续段落')
    expect(blocks).toEqual([
      { type: 'html', html: '<div class="card">\n<p>内容</p>\n</div>' },
      { type: 'paragraph', text: '后续段落' },
    ])
  })

  it('单行自闭合与行内嵌套正常产出', () => {
    expect(markdownToBlocks('<hr />')).toEqual([{ type: 'html', html: '<hr />' }])
    const one = markdownToBlocks('<p>第 <b>一</b> 段</p>')
    expect(one[0]).toEqual({ type: 'html', html: '<p>第 <b>一</b> 段</p>' })
  })

  it('未闭合标签捕获到空行为止，unclosed 不会吞掉后续内容', () => {
    const blocks = markdownToBlocks('<div class="a">\n第一行\n第二行\n\n普通段落')
    expect(blocks[0]?.type).toBe('html')
    expect(blocks[1]).toEqual({ type: 'paragraph', text: '普通段落' })
  })

  it('非白名单标签的行不开 html block，按普通段落转义', () => {
    const blocks = markdownToBlocks('<custom-el>文本</custom-el>')
    expect(blocks).toEqual([{ type: 'paragraph', text: '<custom-el>文本</custom-el>' }])
  })

  it('script / style 连同内容整体丢弃，未知标签只丢标签保文字', () => {
    const clean = sanitizeHtmlBlock('<div>x</div><script>alert(1)</script><foo>bar</foo>')
    expect(clean).not.toContain('script')
    expect(clean).not.toContain('alert(1)')
    expect(clean).toContain('bar')
    expect(clean).toContain('x')
  })

  it('事件属性与保留 id 被剥除', () => {
    const clean = sanitizeHtmlBlock('<div onclick="x()" id="app" data-x="1">t</div>')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('id=')
    expect(clean).not.toContain('data-x')
  })

  it('h1 归一为 h2（页面级 h1 属于标题）', () => {
    expect(sanitizeHtmlBlock('<h1>标题</h1>')).toBe('<h2>标题</h2>')
  })

  it('白名单属性保留且值重新转义', () => {
    const clean = sanitizeHtmlBlock('<div class="a" title="A&B">t</div>')
    expect(clean).toContain('class="a"')
    expect(clean).toContain('title="A&amp;B"')
  })

  it('target=_blank 的 a 自动补 noopener', () => {
    const clean = sanitizeHtmlBlock('<a href="https://example.com" target="_blank">x</a>')
    expect(clean).toContain('rel="noopener noreferrer"')
  })

  it('style 放行常规值，危险值整条丢弃', () => {
    expect(sanitizeHtmlBlock('<div style="color:red;padding:4px">t</div>')).toContain(
      'style="color:red;padding:4px"',
    )
    // url() 只放行 https / 站内相对路径
    expect(sanitizeHtmlBlock('<div style="background:url(javascript:alert(1))">t</div>')).not.toContain('style=')
    expect(sanitizeHtmlBlock('<div style="background:url(https://a.com/x.png)">t</div>')).toContain(
      'url(https://a.com/x.png)',
    )
    // 表达式与脚本协议
    expect(sanitizeHtmlBlock('<div style="width:expression(x)">t</div>')).not.toContain('style=')
  })

  it('href / src 危险协议被剥除', () => {
    const clean = sanitizeHtmlBlock('<a href="javascript:alert(1)">x</a><img src="data:image/png;base64,AA" alt="y" />')
    expect(clean).not.toContain('href=')
    expect(clean).not.toContain('src=')
    expect(clean).toContain('x')
    expect(clean).toContain('alt="y"')
  })

  it('文本节点转义尖括号、不重复转义已写好的实体', () => {
    const clean = sanitizeHtmlBlock('<div>A &amp; B &lt; C</div>')
    expect(clean).toBe('<div>A &amp; B &lt; C</div>')
    // 引号内含 > 不算标签结束（按引号配对扫描）
    const quoted = sanitizeHtmlBlock('<div title="a>b">t</div>')
    expect(quoted).toContain('title="a&gt;b"')
  })

  it('白名单是双端唯一来源：sanitize.ts 复用同一份数组', () => {
    expect(HTML_TAG_ALLOWLIST).toContain('div')
    expect(HTML_TAG_ALLOWLIST).not.toContain('script')
    expect(HTML_ATTR_ALLOWLIST).toContain('style')
    expect(HTML_ATTR_ALLOWLIST).not.toContain('onclick')
  })

  it('blocksToHtml 的 html 分支直接输出净化产物', () => {
    const html = blocksToHtml([{ type: 'html', html: '<div class="card"><p>x</p></div>' }])
    expect(html).toBe('<div class="card"><p>x</p></div>')
  })
})

describe('blocksToHtml', () => {
  it('类名与 ArticleBody.vue 对齐', () => {
    const html = blocksToHtml([
      { type: 'heading', id: 'sec-1', text: '标题' },
      { type: 'quote', text: '引文' },
    ])
    expect(html).toContain('<h2 id="sec-1" class="article-body__heading">标题</h2>')
    expect(html).toContain('<blockquote class="article-body__quote">引文</blockquote>')
  })

  it('代码块带高亮 HTML 时直接输出（构建期产物可信），无则转义纯文本', () => {
    const highlighted = blocksToHtml([
      { type: 'code', lang: 'ts', text: 'const a = 1', codeHtml: '<span style="color:#f00">const</span> a = 1' },
    ])
    expect(highlighted).toContain('<span style="color:#f00">const</span>')

    const plain = blocksToHtml([{ type: 'code', lang: 'html', text: '<script>alert(1)</script>' }])
    expect(plain).not.toContain('<script>')
    expect(plain).toContain('&lt;script&gt;')
  })

  it('HTML 特殊字符被转义（防注入）', () => {
    const html = blocksToHtml([{ type: 'paragraph', text: '<script>alert(1)</script>' }])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('代码块渲染为 pre code 且内容转义', () => {
    const html = blocksToHtml([
      { type: 'code', lang: 'html', text: '<script>alert(1)</script>' },
    ])
    expect(html).toContain('class="article-body__code" data-lang="html"')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('表格渲染为 table 且单元格行内格式生效', () => {
    const html = blocksToHtml([
      { type: 'table', head: ['阶段'], rows: [['**基础建设**']] },
    ])
    expect(html).toContain('class="article-body__tablewrap"')
    expect(html).toContain('<th>阶段</th>')
    expect(html).toContain('<td><strong>基础建设</strong></td>')
  })

  it('嵌套子列表渲染在父 li 内部', () => {
    const html = blocksToHtml([
      {
        type: 'list',
        ordered: true,
        items: [{ text: '父', children: ['子'], childrenOrdered: false }],
      },
    ])
    expect(html).toContain('<li>父<ul class="article-body__ulist"><li>子</li></ul></li>')
  })

  it('段落行内粗体生效且 HTML 注入被转义', () => {
    const html = blocksToHtml([{ type: 'paragraph', text: '**加粗** <script>x</script>' }])
    expect(html).toContain('<p><strong>加粗</strong> &lt;script&gt;x&lt;/script&gt;</p>')
  })
})
