import { ref } from 'vue'
import { STORAGE, derivedKey, readStored, writeStored } from '@/utils/storage'

/**
 * 本机阅读统计（动态热门榜的数据源）
 *
 * 静态博客没有后端，frontmatter 里的 views 只是站长预置的基数。
 * 这里用 localStorage 记录访客本机的真实浏览行为，叠加在基数上：
 * - 看一篇涨一篇，热门文章榜 / 卡片阅读数实时重排（响应式）
 * - 同次数按最近读的优先
 * - localStorage 不可用（隐私模式等）时静默降级为纯基数
 *
 * 键名一律取自 @/utils/storage 的注册表（含旧键迁移），本文件不再出现字面量键名。
 */

/** 最近一次阅读时间戳（ms）：热门榜同次数时「最近读的优先」的依据 */
const LAST_READ_KEY = derivedKey(STORAGE.viewStats, 'last-at')

function parseCounts(raw: string | null): Record<string, number> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

/** 内存中的事实源：启动时从 localStorage 恢复，写操作同步回写磁盘 */
const counts = ref<Record<string, number>>(parseCounts(readStored(STORAGE.viewStats)))

const lastAt = ref<Record<string, number>>(parseCounts(readStored(LAST_READ_KEY)))

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

/** 记一次真实浏览（进入文章详情页时调用，每次进入都计数——「看一篇涨一篇」） */
export function recordView(slug: string): void {
  if (!slug) return

  const next = { ...counts.value, [slug]: (counts.value[slug] ?? 0) + 1 }
  // 存不进去就没法动态，直接放弃（静态基数兜底）
  if (!writeStored(STORAGE.viewStats, JSON.stringify(next))) return
  counts.value = next

  const nextLast = { ...lastAt.value, [slug]: Date.now() }
  // 时间戳写失败只影响同次数排序，主计数不受影响
  writeStored(LAST_READ_KEY, JSON.stringify(nextLast))
  lastAt.value = nextLast
}
