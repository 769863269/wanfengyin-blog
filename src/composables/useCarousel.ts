import { computed, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useMediaQuery } from '@/utils/mediaQuery'

/**
 * 轮播控制
 *
 * 相比原始模板的三点增强：
 *   1. 移动端暂停（原版用 CSS 隐藏了轮播，但 setInterval 仍在空转）；
 *   2. 鼠标悬停暂停（用户想看清内容时不该被打断）；
 *   3. 页面切到后台时暂停（visibilitychange），省电省 CPU。
 */
export function useCarousel(count: MaybeRefOrGetter<number>, interval = 4000) {
  const activeIndex = ref(0)
  const isHovered = ref(false)
  const isPageVisible = ref(true)

  const mobile = useMediaQuery('(max-width: 768px)')
  const isMobile = ref(mobile.matches)
  const unsubscribeMedia = mobile.subscribe((matches) => {
    isMobile.value = matches
  })

  let timer: ReturnType<typeof setInterval> | null = null

  const slideCount = computed(() => Math.max(0, toValue(count)))

  const shouldPlay = computed(
    () => !isMobile.value && !isHovered.value && isPageVisible.value && slideCount.value > 1,
  )

  function stop(): void {
    if (timer === null) return
    clearInterval(timer)
    timer = null
  }

  function start(): void {
    if (timer !== null) return
    timer = setInterval(() => {
      next()
    }, interval)
  }

  function goTo(index: number): void {
    const total = slideCount.value
    if (total <= 0) return
    // 取模后仍可能为负（index 为负且绝对值大于 total），再补一次
    activeIndex.value = ((index % total) + total) % total
  }

  function next(): void {
    goTo(activeIndex.value + 1)
  }

  function prev(): void {
    goTo(activeIndex.value - 1)
  }

  /** 手动切换后重置计时，避免刚点完就自动跳到下一张 */
  function select(index: number): void {
    goTo(index)
    if (timer !== null) {
      stop()
      start()
    }
  }

  watch(
    shouldPlay,
    (play) => {
      if (play) start()
      else stop()
    },
    { immediate: true },
  )

  // 幻灯片数量变化（如数据异步加载）时，索引不能越界
  watch(slideCount, (total) => {
    if (activeIndex.value > total - 1) activeIndex.value = Math.max(0, total - 1)
  })

  const handleVisibility = () => {
    isPageVisible.value = document.visibilityState !== 'hidden'
  }

  document.addEventListener('visibilitychange', handleVisibility)

  onScopeDispose(() => {
    stop()
    unsubscribeMedia()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return {
    activeIndex,
    isHovered,
    slideCount,
    goTo,
    next,
    prev,
    select,
    play: start,
    pause: stop,
  }
}
