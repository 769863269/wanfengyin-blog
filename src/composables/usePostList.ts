import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { Post } from '@/types'

/**
 * 文章列表分页（「加载更多」）
 *
 * 原始模板的做法是给隐藏文章加 .extra 类，点击时用 JS 逐个移除。
 * 问题：DOM 里始终存在全部文章，靠 CSS 隐藏，语义上是「全部渲染再藏起来」。
 * 这里改为按数量切片，未加载的文章根本不进 DOM。
 *
 * 状态为模块级（而非组件内）：用户「首页 → 文章详情 → 返回」时，
 * HomeView 会被卸载再重挂载，若状态放组件里，加载进度就会清零，
 * 表现为「展开的文章被收回」。提升到模块级后跨路由保留进度，
 * 只有显式调用 reset()（如切换标签筛选）才回到第一页。
 *
 * 注意：模块级状态即全局单例，当前唯一消费方是首页文章列表。
 * 若未来有第二个列表也要分页，请为本函数增加 scopeKey 参数做状态隔离。
 */

/** 模块级分页进度；首次调用时以调用方的 pageSize 初始化 */
let sharedCount: Ref<number> | undefined

export function usePostList(source: MaybeRefOrGetter<readonly Post[]>, pageSize: number) {
  sharedCount ??= ref(pageSize)
  const visibleCount = sharedCount

  const all = computed(() => toValue(source))
  const visible = computed(() => all.value.slice(0, visibleCount.value))
  const total = computed(() => all.value.length)
  const hasMore = computed(() => visibleCount.value < all.value.length)
  const remaining = computed(() => Math.max(0, all.value.length - visibleCount.value))

  function loadMore(): void {
    if (!hasMore.value) return
    visibleCount.value = Math.min(visibleCount.value + pageSize, all.value.length)
  }

  /** 一次性展开全部（搜索态直接使用，无需分页） */
  function showAll(): void {
    visibleCount.value = all.value.length
  }

  function reset(): void {
    visibleCount.value = pageSize
  }

  return {
    visible,
    total,
    hasMore,
    remaining,
    loadMore,
    showAll,
    reset,
  }
}
