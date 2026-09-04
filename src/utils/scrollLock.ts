/**
 * 页面滚动锁（共享工具）
 *
 * 弹窗 / 抽屉打开时锁定 body 滚动，关闭时精确还原。
 * 记录原值再覆盖而不是清空内联样式，避免丢失元素原有的布局样式。
 *
 * 支持嵌套场景（如抽屉上再开搜索弹窗）：引用计数归零才真正解锁。
 */

let lockCount = 0
let previousOverflow = ''

export function lockBodyScroll(): void {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBodyScroll(): void {
  if (lockCount === 0) return
  lockCount--
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
    previousOverflow = ''
  }
}
