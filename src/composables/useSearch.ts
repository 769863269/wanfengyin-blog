import { readonly, ref } from 'vue'

/**
 * 站内搜索弹窗状态（@singleton 全局单例）
 *
 * 只负责 UI 状态（是否展开、关键词），
 * 具体的过滤逻辑是纯函数 searchPosts()，放在 utils/search.ts。
 *
 * 状态对外只读：写入一律走本模块暴露的方法（close / setKeyword），
 * 组件里不要直接给 keyword 赋值 —— 「关闭时清空」这类约束收在方法里，
 * 散到调用点就再也收不回来了。
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

  function setKeyword(value: string): void {
    keyword.value = value
  }

  return {
    isOpen: readonly(isOpen),
    keyword: readonly(keyword),
    open,
    close,
    toggle,
    setKeyword,
  }
}
