import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { Post } from '@/types'

/**
 * 文章列表分页（「加载更多」）
 *
 * 原始模板的做法是给隐藏文章加 .extra 类，点击时用 JS 逐个移除。
 * 问题：DOM 里始终存在全部文章，靠 CSS 隐藏，语义上是「全部渲染再藏起来」。
 * 这里改为按数量切片，未加载的文章根本不进 DOM。
 */
export function usePostList(source: MaybeRefOrGetter<readonly Post[]>, pageSize: number) {
  const visibleCount = ref(pageSize)

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
