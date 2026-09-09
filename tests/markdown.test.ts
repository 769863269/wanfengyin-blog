import { describe, expect, it } from 'vitest'
import { blocksToHtml, markdownToBlocks, parseFrontmatter, renderInline } from '../scripts/lib/markdown.mjs'

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

  it('APP 深链白名单（aicenter://）生成 a 标签', () => {
    const html = renderInline('[使用RFQ报价](aicenter://customChat)')
    expect(html).toContain('<a href="aicenter://customChat"')
    expect(html).toContain('>使用RFQ报价</a>')
  })

  it('未收录的 app 协议仍然拦截（data: 不放行）', () => {
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
