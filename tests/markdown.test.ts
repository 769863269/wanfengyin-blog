import { describe, expect, it } from 'vitest'
import { blocksToHtml, markdownToBlocks, parseFrontmatter } from '../scripts/lib/markdown.mjs'

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
      { type: 'heading', text: '小标题' },
      { type: 'paragraph', text: '第二段' },
      { type: 'quote', text: '引文' },
    ])
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
})

describe('blocksToHtml', () => {
  it('类名与 ArticleBody.vue 对齐', () => {
    const html = blocksToHtml([
      { type: 'heading', text: '标题' },
      { type: 'quote', text: '引文' },
    ])
    expect(html).toContain('<h2 class="article-body__heading">标题</h2>')
    expect(html).toContain('<blockquote class="article-body__quote">引文</blockquote>')
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
})
