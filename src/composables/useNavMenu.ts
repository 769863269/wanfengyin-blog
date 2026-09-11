import { ref } from 'vue'

/**
 * 顶栏多级下拉的展开状态（模块级单例）
 *
 * 同时只展开一个节点：openId 记录当前展开项的 NavItem.id。
 * 收起时机统一在三处：再点一次、点面板外、路由跳转后（均由 AppHeader 监听）。
 */
const openId = ref<string | null>(null)

export function useNavMenu() {
  return {
    openId,
    toggle(id: string) {
      openId.value = openId.value === id ? null : id
    },
    close() {
      openId.value = null
    },
  }
}
