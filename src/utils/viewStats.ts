import { ref } from 'vue'

/**
 * 本机阅读统计（动态热门榜的数据源）
 *
 * 静态博客没有后端，frontmatter 里的 views 只是站长预置的基数。
 * 这里用 localStorage 记录访客本机的真实浏览行为，叠加在基数上：
 * - 看一篇涨一篇，热门文章榜 / 卡片阅读数实时重排（响应式）
 * - sessionStorage 防抖：同一会话内刷新同一篇不重复计数
 * - localStorage 不可用（隐私模式等）时静默降级为纯基数
 */

const STORAGE_KEY = 'wanfengyin:view-stats'

function readDisk(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

/** 内存中的事实源：启动时从 localStorage 恢复，写操作同步回写磁盘 */
const counts = ref<Record<string, number>>(readDisk())

/** 最近一次阅读时间戳（ms）：热门榜同次数时「最近读的优先」的依据 */
const LAST_KEY = `${STORAGE_KEY}:last-at`
const lastAt = ref<Record<string, number>>((() => {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
})())

/** 该文章在本机的累计阅读次数（响应式：recordView 后所有依赖处自动重算） */
export function localViews(slug: string): number {
  return counts.value[slug] ?? 0
}

/** 本机最近一次阅读该文章的时间戳（0 = 从未读过） */
export function lastReadAt(slug: string): number {
  return lastAt.value[slug] ?? 0
}

/** 展示用阅读数 = frontmatter 基数 + 本机浏览增量 */
export function totalViews(seedViews: number, slug: string): number {
  return seedViews + localViews(slug)
}

function hasRecordedThisSession(slug: string): boolean {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY}:${slug}`) === '1'
  } catch {
    return false
  }
}

/** 记一次真实浏览（进入文章详情页时调用） */
export function recordView(slug: string): void {
  if (!slug || hasRecordedThisSession(slug)) return

  const next = { ...counts.value, [slug]: (counts.value[slug] ?? 0) + 1 }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    return // 存不进去就没法动态，直接放弃（静态基数兜底）
  }
  counts.value = next

  const nextLast = { ...lastAt.value, [slug]: Date.now() }
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(nextLast))
  } catch {
    // 时间戳写失败只影响同次数排序，主计数不受影响
  }
  lastAt.value = nextLast

  try {
    sessionStorage.setItem(`${STORAGE_KEY}:${slug}`, '1')
  } catch {
    // 防抖标记写失败只影响去重，不影响主数据
  }
}
