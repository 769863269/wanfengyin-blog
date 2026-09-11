import type { NavItem } from '@/types'

/**
 * 判断某导航项的子树内是否有叶子的目标路由与当前路由名一致（递归）
 *
 * 用途：分支节点（顶栏下拉 / 抽屉折叠组）本身不跳转、没有 router-link-active，
 * 需要靠「子项激活 → 父项高亮」让用户看出当前所在板块。
 */
export function navSubtreeHas(item: NavItem, routeName: string): boolean {
  if (!routeName) return false
  if (item.kind === 'route' && item.to === routeName) return true
  return (item.children ?? []).some((child) => navSubtreeHas(child, routeName))
}
