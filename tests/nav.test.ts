import { describe, expect, it } from 'vitest'
import { isPageReachable, navReferencedSlugs } from '../scripts/lib/nav.mjs'
import { navSubtreeHas } from '../src/utils/navTree'
import type { NavItem } from '../src/types'

/** 分支节点高亮：子树内是否有叶子指向当前路由（顶栏下拉 / 抽屉折叠组共用） */
describe('navSubtreeHas', () => {
  const tree: NavItem = {
    id: 'n0', label: '测试', icon: '', kind: 'disabled',
    children: [
      { id: 'n0-0', label: '混合布局', icon: '', kind: 'route', to: 'html-mixed' },
      {
        id: 'n0-1', label: '更深', icon: '', kind: 'disabled',
        children: [{ id: 'n0-1-0', label: '单页', icon: '', kind: 'route', to: 'html-showcase' }],
      },
    ],
  }

  it('直接子叶子命中', () => {
    expect(navSubtreeHas(tree, 'html-mixed')).toBe(true)
  })
  it('深层子叶子命中（递归）', () => {
    expect(navSubtreeHas(tree, 'html-showcase')).toBe(true)
  })
  it('不在子树内 → false', () => {
    expect(navSubtreeHas(tree, 'home')).toBe(false)
  })
  it('空路由名兜底 false；叶子项自身可比对', () => {
    expect(navSubtreeHas(tree, '')).toBe(false)
    const leaf: NavItem = { id: 'l', label: '首页', icon: '', kind: 'route', to: 'home' }
    expect(navSubtreeHas(leaf, 'home')).toBe(true)
  })
})

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
