import { readonly, ref } from 'vue'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'

/**
 * 移动端抽屉菜单状态（全局单例）
 *
 * 原始模板把菜单逻辑内联在页面里，靠 getElementById 抓取 DOM。
 * 这里改为状态驱动：trigger 与 drawer 是两个独立组件也能天然同步。
 */

const isOpen = ref(false)
let escBound = false

function bindEscape(): void {
  if (escBound) return
  escBound = true

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) close()
  })
}

export function useDrawer() {
  function open(): void {
    if (isOpen.value) return
    isOpen.value = true
    lockBodyScroll()
    bindEscape()
  }

  function close(): void {
    if (!isOpen.value) return
    isOpen.value = false
    unlockBodyScroll()
  }

  function toggle(): void {
    if (isOpen.value) close()
    else open()
  }

  return {
    isOpen: readonly(isOpen),
    open,
    close,
    toggle,
  }
}
