import { describe, expect, it } from 'vitest'
import { isPageReachable, navReferencedSlugs } from '../scripts/lib/nav.mjs'

/** 多级导航的可达性规则：子菜单里的引用算数、hidden 整枝不算（与 build-pages 共用） */
describe('navReferencedSlugs', () => {
  it('递归收集子菜单里的 route 引用', () => {
    const slugs = navReferencedSlugs({
      mainNav: [
        { label: '首页', kind: 'route', target: 'home' },
        {
          label: '内容', kind: 'route', target: 'archive',
          children: [
            { label: '页面', kind: 'route', target: 'dome' },
            { label: '占位', kind: 'disabled', target: '' },
          ],
        },
      ],
    })
    expect(slugs.has('home')).toBe(true)
    expect(slugs.has('archive')).toBe(true)
    expect(slugs.has('dome')).toBe(true)
    expect(slugs.size).toBe(3)
  })

  it('hidden 整枝跳过（父项隐藏则子级引用一并失效）', () => {
    const slugs = navReferencedSlugs({
      mainNav: [
        { label: '隐藏组', kind: 'hidden', target: '', children: [{ label: '页面', kind: 'route', target: 'dome' }] },
        { label: '可见', kind: 'route', target: 'home' },
      ],
    })
    expect(slugs.has('dome')).toBe(false)
    expect(slugs.has('home')).toBe(true)
  })

  it('兼容旧 mobileExtraNav（读侧容忍）', () => {
    const slugs = navReferencedSlugs({ mobileExtraNav: [{ kind: 'route', target: 'dome' }] })
    expect(slugs.has('dome')).toBe(true)
  })
})

describe('isPageReachable', () => {
  const slugs = new Set(['dome'])
  it('published + 菜单引用 → 可达', () => {
    expect(isPageReachable({ slug: 'dome', status: 'published' }, slugs)).toBe(true)
  })
  it('published + directAccess（字符串 true 也认）→ 可达', () => {
    expect(isPageReachable({ slug: 'x', status: 'published', directAccess: 'true' }, slugs)).toBe(true)
  })
  it('draft → 不可达', () => {
    expect(isPageReachable({ slug: 'dome', status: 'draft' }, slugs)).toBe(false)
  })
  it('未引用且未直链 → 不可达（前台 404）', () => {
    expect(isPageReachable({ slug: 'y', status: 'published' }, slugs)).toBe(false)
  })
})
