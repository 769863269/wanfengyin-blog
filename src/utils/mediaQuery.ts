/**
 * 媒体查询安全封装
 *
 * window.matchMedia 在部分老浏览器 / 非浏览器环境（SSR、测试）中不存在，
 * 直接调用会抛错并中断整个脚本。所有媒体查询一律走这里。
 *
 * 命名说明：刻意不加 use 前缀 —— 它返回的是「快照 + 订阅函数」，
 * 不是 Vue 响应式状态（VueUse 的 useMediaQuery 返回 ref，语义不同，
 * 同名会误导）。本文件留在 utils/ 也正是因为它与框架无关。
 */

/** 媒体查询对象的最小可用子集，用于降级兜底 */
export interface SafeMediaQuery {
  readonly matches: boolean
  /** 注册变化监听；返回取消监听函数（始终返回一个可安全调用的函数） */
  subscribe(listener: (matches: boolean) => void): () => void
}

const FALLBACK_DISPATCH = () => () => undefined

function createFallback(): SafeMediaQuery {
  return { matches: false, subscribe: FALLBACK_DISPATCH }
}

/**
 * 获取媒体查询。环境不支持时返回 matches 恒为 false 的降级对象，绝不抛错。
 *
 * 注意：同一 query 反复调用会重复创建实例（浏览器侧可能共用底层 MediaQueryList，
 * 但监听器是各注册各的）。需要在多处使用同一个 query 时，调用方自行缓存实例。
 */
export function safeMediaQuery(query: string): SafeMediaQuery {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return createFallback()
  }

  let mql: MediaQueryList
  try {
    mql = window.matchMedia(query)
  } catch {
    // 语法非法的查询串同样会抛错
    return createFallback()
  }

  return {
    get matches() {
      return mql.matches
    },
    subscribe(listener) {
      const handler = (event: MediaQueryListEvent) => listener(event.matches)

      // 优先 addEventListener，退化到已废弃的 addListener
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
      }

      if (typeof mql.addListener === 'function') {
        mql.addListener(handler)
        return () => mql.removeListener(handler)
      }

      return () => undefined
    },
  }
}
