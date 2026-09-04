import type { Directive } from 'vue'

/**
 * v-lazy-bg —— 进入视口才加载背景图
 *
 * 用法：`<div v-lazy-bg="post.cover" />`
 * 值可以是图片 URL，也可以是任意合法的 CSS background-image 值（如渐变）。
 *
 * 原始模板用 data-bg 属性 + 全局 querySelectorAll 扫描，
 * 新增元素需要重新扫描；指令则是每个元素自治，随挂载 / 卸载自动生效。
 */

type LazyBgElement = HTMLElement & { _lazyObserver?: IntersectionObserver }

function apply(el: HTMLElement, value: string): void {
  el.style.backgroundImage = value
  el.dataset.lazyLoaded = 'true'
}

function loadImmediately(el: HTMLElement, value: string): void {
  if (!value) return
  apply(el, value)
}

export const lazyBg: Directive<LazyBgElement, string> = {
  mounted(el, binding) {
    const value = binding.value
    if (!value) return

    // 环境不支持时直接加载，不能让图片永远不显示
    if (typeof IntersectionObserver === 'undefined') {
      loadImmediately(el, value)
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          apply(el, value)
          obs.unobserve(el)
        }
      },
      { rootMargin: '200px 0px' }, // 提前 200px 加载，滚动到位时已就绪
    )

    el._lazyObserver = observer
    observer.observe(el)
  },

  updated(el, binding) {
    if (binding.value === binding.oldValue) return

    if (typeof IntersectionObserver === 'undefined') {
      loadImmediately(el, binding.value)
      return
    }

    // 值变了：重新观察
    el._lazyObserver?.disconnect()
    el.dataset.lazyLoaded = 'false'

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          apply(el, binding.value)
          obs.unobserve(el)
        }
      },
      { rootMargin: '200px 0px' },
    )

    el._lazyObserver = observer
    observer.observe(el)
  },

  unmounted(el) {
    el._lazyObserver?.disconnect()
    delete el._lazyObserver
  },
}
