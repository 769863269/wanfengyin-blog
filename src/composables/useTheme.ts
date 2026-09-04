import { readonly, ref } from 'vue'
import type { ThemeMode } from '@/types'
import { useMediaQuery } from '@/utils/mediaQuery'

/**
 * 夜间模式（全局单例）
 *
 * 原始模板的问题：
 *   1. `getElementById('themeToggle')` 拿到的只是第一个按钮，
 *      PC 顶栏与移动端顶栏两个按钮只有一个生效；
 *   2. `apply(undefined)` 时 classList.toggle 会变成「切换」而非「设置」。
 *
 * 这里改为模块级单例状态：任意组件调用 useTheme() 拿到的都是同一份状态，
 * 所有按钮自动同步，彻底消除多按钮状态不一致的问题。
 */

const STORAGE_KEY = 'night'
const TRANSITION_CLASS = 'theme-transition'
const TRANSITION_DURATION = 320

const isDark = ref<boolean>(false)
/** 用户是否手动切换过。未手动切换时持续跟随系统偏好 */
const isPinned = ref<boolean>(false)
let initialized = false

function readStored(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === '1') return true
    if (raw === '0') return false
    return null
  } catch {
    // 隐私模式 / 禁用 localStorage 时静默降级
    return null
  }
}

function persist(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* 忽略写入失败 */
  }
}

/** 应用主题到 <html>，并在切换期间开启过渡（避免首屏所有元素一起动画） */
function applyToDocument(dark: boolean, animate: boolean): void {
  const root = document.documentElement

  if (animate) {
    root.classList.add(TRANSITION_CLASS)
    window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_DURATION)
  }

  // 强制布尔化，杜绝 toggle 的「无参即切换」语义
  root.classList.toggle('night', dark === true)
}

function init(): void {
  if (initialized) return
  initialized = true

  const stored = readStored()
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)').matches

  isPinned.value = stored !== null
  isDark.value = stored ?? prefersDark

  // 首屏由 index.html 的内联脚本同步设置过，此处不加过渡，避免闪一下
  applyToDocument(isDark.value, false)

  // 未手动固定时，跟随系统偏好实时变化
  useMediaQuery('(prefers-color-scheme: dark)').subscribe((matches) => {
    if (isPinned.value) return
    isDark.value = matches
    applyToDocument(matches, true)
  })
}

export function useTheme() {
  init()

  const mode = (): ThemeMode => (isDark.value ? 'dark' : 'light')

  /** 切换主题（手动切换后会固定，不再跟随系统） */
  function toggle(): void {
    isDark.value = !isDark.value
    isPinned.value = true
    persist(isDark.value)
    applyToDocument(isDark.value, true)
  }

  /** 直接设置指定模式 */
  function setMode(next: ThemeMode): void {
    const dark = next === 'dark'
    if (dark === isDark.value) return

    isDark.value = dark
    isPinned.value = true
    persist(dark)
    applyToDocument(dark, true)
  }

  /** 清除手动设置，恢复跟随系统 */
  function reset(): void {
    isPinned.value = false
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 忽略 */
    }

    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    applyToDocument(prefersDark, true)
  }

  return {
    isDark: readonly(isDark),
    isPinned: readonly(isPinned),
    mode,
    toggle,
    setMode,
    reset,
  }
}
