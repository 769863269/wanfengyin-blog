<script setup lang="ts">
/**
 * 通用图标（内联 SVG path）
 * 统一 24x24 视图，尺寸通过 CSS 控制，默认继承 currentColor。
 */
interface Props {
  /** SVG path 的 d 属性 */
  path: string
  /** 无障碍标签；不传则视为装饰性图标，对读屏软件隐藏 */
  label?: string
}

const { path, label } = defineProps<Props>()
</script>

<template>
  <svg
    class="base-icon"
    viewBox="0 0 24 24"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.base-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  flex: 0 0 auto;
}
</style>
