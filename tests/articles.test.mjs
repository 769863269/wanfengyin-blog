/**
 * 文章源读取层 / 数据门禁测试
 *
 * 门禁是防止「图片内联 base64 拖垮首屏」这类问题的第一道闸，
 * 必须有测试兜着，否则哪天被顺手删掉都没人发现。
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ArticleError,
  MAX_ARTICLE_BYTES,
  listArticleFiles,
  readAllArticles,
  readArticle,
} from '../scripts/lib/articles.mjs'

let dir

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'wfy-articles-'))
})

afterAll(() => {
  // 临时目录交由系统回收：本机 safe-delete 钩子可能拦截递归删除，失败不影响测试结论
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

/** 写一篇文章并返回文件名 */
function write(name, content) {
  writeFileSync(join(dir, name), content, 'utf8')
  return name
}

/** 生成一篇合法文章的 markdown（可覆盖/追加 frontmatter 行与正文） */
function article({ slug = 'demo', status = null, body = '正文内容', extra = '' } = {}) {
  return [
    '---',
    `slug: ${slug}`,
    'title: 标题',
    'excerpt: 摘要',
    'publishedAt: 2026-01-01',
    'tags: [测试]',
    ...(status ? [`status: ${status}`] : []),
    ...(extra ? [extra] : []),
    '---',
    '',
    body,
    '',
  ].join('\n')
}

describe('listArticleFiles', () => {
  it('排除 README 与 _ 前缀文档', () => {
    const d = mkdtempSync(join(tmpdir(), 'wfy-list-'))
    writeFileSync(join(d, 'README.md'), 'x')
    writeFileSync(join(d, '_draft.md'), 'x')
    writeFileSync(join(d, '2026-01-01-a.md'), 'x')
    expect(listArticleFiles(d)).toEqual(['2026-01-01-a.md'])
  })
})

describe('readArticle 数据门禁', () => {
  it('合法文章通过并归一化字段', () => {
    const file = write('ok.md', article({ slug: 'ok' }))
    const result = readArticle(dir, file)
    expect(result.meta.slug).toBe('ok')
    expect(result.meta.tags).toEqual(['测试'])
    expect(result.skipped).toBe(false)
  })

  it('内联 base64 图片直接拦下', () => {
    const file = write('b64.md', article({ body: '![图](data:image/png;base64,iVBORw0KGgo)' }))
    expect(() => readArticle(dir, file)).toThrow(ArticleError)
    expect(() => readArticle(dir, file)).toThrow(/内联 base64/)
  })

  it('html 形式的内联 base64 同样拦下', () => {
    const file = write('b64-html.md', article({ body: '<img src="data:image/jpeg;base64,/9j/4AAQ" />' }))
    expect(() => readArticle(dir, file)).toThrow(/内联 base64/)
  })

  it('单篇体积超上限拦下', () => {
    const file = write('huge.md', article({ body: 'x'.repeat(MAX_ARTICLE_BYTES + 10) }))
    expect(() => readArticle(dir, file)).toThrow(/超过上限/)
  })

  it('已发布文章缺必填字段拦下', () => {
    const file = write('missing.md', '---\nslug: m\ntitle: 只有标题\n---\n\n正文\n')
    expect(() => readArticle(dir, file)).toThrow(/缺少必填字段/)
  })

  it('草稿放宽必填校验，但 base64 门禁仍然生效', () => {
    const draft = write('draft.md', '---\nslug: d\nstatus: draft\n---\n\n写到一半\n')
    expect(readArticle(dir, draft).skipped).toBe(true)

    const badDraft = write('draft-b64.md', article({ slug: 'd2', status: 'draft', body: '![a](data:image/png;base64,AAA)' }))
    expect(() => readArticle(dir, badDraft)).toThrow(/内联 base64/)
  })
})

describe('readAllArticles', () => {
  it('slug 重复报错', () => {
    const d = mkdtempSync(join(tmpdir(), 'wfy-dup-'))
    writeFileSync(join(d, 'a.md'), article({ slug: 'same' }))
    writeFileSync(join(d, 'b.md'), article({ slug: 'same' }))
    expect(() => readAllArticles(d)).toThrow(/重复/)
  })

  it('按发布时间倒序，草稿计入 skipped', () => {
    const d = mkdtempSync(join(tmpdir(), 'wfy-sort-'))
    writeFileSync(join(d, 'old.md'), article({ slug: 'old' }).replace('2026-01-01', '2026-01-01'))
    writeFileSync(join(d, 'new.md'), article({ slug: 'new' }).replace('2026-01-01', '2026-06-01'))
    writeFileSync(join(d, 'draft.md'), article({ slug: 'draft', status: 'draft' }))

    const { articles, skipped } = readAllArticles(d)
    expect(articles.map((a) => a.meta.slug)).toEqual(['new', 'old'])
    expect(skipped).toBe(1)
  })
})
