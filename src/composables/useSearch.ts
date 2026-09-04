import { readonly, ref } from 'vue'

/**
 * 站内搜索弹窗状态（全局单例）
 *
 * 只负责 UI 状态（是否展开、关键词），
 * 具体的过滤逻辑是纯函数 searchPosts()，放在 utils/search.ts。
 */

const isOpen = ref(false)
const keyword = ref('')

export function useSearch() {
  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    // 关闭即清空，下次打开是干净状态
    keyword.value = ''
  }

  function toggle(): void {
    if (isOpen.value) close()
    else open()
  }

  return {
    isOpen: readonly(isOpen),
    keyword,
    open,
    close,
    toggle,
  }
}
