import { readonly, ref } from 'vue'
import type { ThemeMode } from '@/types'
import { safeMediaQuery, type SafeMediaQuery } from '@/utils/mediaQuery'
import { STORAGE, readStored, removeStored, writeStored } from '@/utils/storage'

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
 *
 * 存储键不在此处定义（曾在useTheme 与 public/theme-init.js 各写一份导致漂移），
 * 统一走 @/utils/storage 的注册表。
 */

const TRANSITION_CLASS = 'theme-transition'
const TRANSITION_DURATION = 320

const isDark = ref<boolean>(false)
/** 用户是否手动切换过。未手动切换时持续跟随系统偏好 */
const isPinned = ref<boolean>(false)
let initialized = false

/** 系统深色偏好：整模块共用一个实例（同一 query 反复 matchMedia 纯属浪费） */
let systemDark: SafeMediaQuery | null = null
function prefersDark(): SafeMediaQuery {
  systemDark ??= safeMediaQuery('(prefers-color-scheme: dark)')
  return systemDark
}

/** 读取持久化的主题：'1' 深色 / '0' 浅色 / null 未设置（跟随系统） */
function readPersisted(): boolean | null {
  const raw = readStored(STORAGE.theme)
  if (raw === '1') return true
  if (raw === '0') return false
  return null
}

function persist(value: boolean): void {
  writeStored(STORAGE.theme, value ? '1' : '0')
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

  const stored = readPersisted()

  isPinned.value = stored !== null
  isDark.value = stored ?? prefersDark().matches

  // 首屏由 public/theme-init.js 同步设置过，此处不加过渡，避免闪一下
  applyToDocument(isDark.value, false)

  // 未手动固定时，跟随系统偏好实时变化
  prefersDark().subscribe((matches) => {
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
    removeStored(STORAGE.theme)

    const dark = prefersDark().matches
    isDark.value = dark
    applyToDocument(dark, true)
  }

  return {
    /** 当前是否深色（只读：改主题请走 toggle / setMode / reset） */
    isDark: readonly(isDark),
    /** 是否已手动固定（只读） */
    isPinned: readonly(isPinned),
    mode,
    toggle,
    setMode,
    reset,
  }
}
