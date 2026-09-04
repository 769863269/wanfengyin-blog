import { describe, expect, it } from 'vitest'
import { estimateReadingTime, formatCount, formatDate, formatRelativeTime } from '@/utils/format'

/** 固定基准时间，避免测试随时间推移而失真 */
const NOW = new Date('2026-09-04T12:00:00+08:00')

describe('formatRelativeTime', () => {
  it('1 分钟内 → 刚刚', () => {
    expect(formatRelativeTime('2026-09-04T11:59:30+08:00', NOW)).toBe('刚刚')
  })

  it('小时内按分钟', () => {
    expect(formatRelativeTime('2026-09-04T11:30:00+08:00', NOW)).toBe('30分钟前')
  })

  it('24 小时内按小时', () => {
    expect(formatRelativeTime('2026-09-04T06:00:00+08:00', NOW)).toBe('6小时前')
  })

  it('30 天内按天', () => {
    expect(formatRelativeTime('2026-09-02T12:00:00+08:00', NOW)).toBe('2天前')
  })

  it('12 个月内按月', () => {
    expect(formatRelativeTime('2026-05-14T12:00:00+08:00', NOW)).toBe('3个月前')
  })

  it('更早按年', () => {
    expect(formatRelativeTime('2024-09-04T12:00:00+08:00', NOW)).toBe('2年前')
  })

  it('未来日期显示绝对日期，不出现负数', () => {
    expect(formatRelativeTime('2026-09-10T12:00:00+08:00', NOW)).toBe('2026-09-10')
  })

  it('非法日期返回空串', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('')
  })
})

describe('formatDate', () => {
  it('格式化为 YYYY-MM-DD', () => {
    expect(formatDate('2026-09-02')).toBe('2026-09-02')
  })

  it('非法日期返回空串', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('formatCount', () => {
  it('小于 1000 原样输出', () => {
    expect(formatCount(609)).toBe('609')
    expect(formatCount(0)).toBe('0')
  })

  it('千位保留一位小数', () => {
    expect(formatCount(1600)).toBe('1.6k')
  })

  it('万位不保留小数', () => {
    expect(formatCount(16000)).toBe('16k')
  })

  it('非法输入兜底为 0', () => {
    expect(formatCount(Number.NaN)).toBe('0')
    expect(formatCount(-5)).toBe('0')
  })
})

describe('estimateReadingTime', () => {
  it('短文本至少 1 分钟', () => {
    expect(estimateReadingTime('短文本')).toBe(1)
  })

  it('中文按 350 字/分钟估算', () => {
    expect(estimateReadingTime('字'.repeat(700))).toBe(2)
  })
})
