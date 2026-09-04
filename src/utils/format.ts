/**
 * 通用格式化工具
 * 纯函数，无副作用，便于单测。
 */

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * 相对时间。
 *
 * 原始模板把「1天前」这类文案硬编码在 HTML 里，随时间推移会失真。
 * 这里改为按 ISO 日期实时计算。
 *
 * @param iso ISO 8601 日期字符串
 * @param now 基准时间，默认当前时间（传入固定值便于测试）
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const target = new Date(iso)
  const targetTime = target.getTime()

  if (Number.isNaN(targetTime)) return ''

  const diff = now.getTime() - targetTime

  // 未来日期：直接显示绝对日期，避免出现「-3天前」
  if (diff < 0) return formatDate(iso)

  if (diff < MINUTE) return '刚刚'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}分钟前`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}小时前`

  const days = Math.floor(diff / DAY)
  if (days < 30) return `${days}天前`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}个月前`

  return `${Math.floor(months / 12)}年前`
}

/** 格式化为 YYYY-MM-DD */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 计数格式化：1600 → "1.6k"，16000 → "16k"
 * 阈值 1000，小于 1000 原样输出。
 */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0'
  if (value < 1000) return String(value)

  const thousands = value / 1000
  // 10k 以上不保留小数，避免 "16.0k" 这种冗余
  const formatted = thousands >= 10 ? Math.round(thousands) : Number(thousands.toFixed(1))

  return `${formatted}k`
}

/** 估算阅读时长（中文按 350 字/分钟） */
export function estimateReadingTime(text: string): number {
  const length = text.trim().length
  return Math.max(1, Math.round(length / 350))
}
