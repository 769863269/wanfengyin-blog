import { readonly, ref } from 'vue'

/**
 * 顶栏多级下拉的展开状态（@singleton 全局单例）
 *
 * 同时只展开一个节点：openId 记录当前展开项的 NavItem.id。
 * 桌面端滑过父项即展开（open），移出整块延时收起（close）；
 * 触屏端没有 hover，退化为点击切换（toggle）。
 * 另有两处统一收起：点面板外、路由跳转后（均由 AppHeader 监听）。
 *
 * 状态对外只读：改展开项一律走 open / toggle / close，组件不要直接改 openId。
 */

const openId = ref<string | null>(null)

export function useNavMenu() {
  /** 滑过即展开（不切换） */
  function open(id: string): void {
    openId.value = id
  }

  function toggle(id: string): void {
    openId.value = openId.value === id ? null : id
  }

  function close(): void {
    openId.value = null
  }

  return {
    openId: readonly(openId),
    open,
    toggle,
    close,
  }
}
