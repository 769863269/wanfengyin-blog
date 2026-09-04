<script setup lang="ts">
/**
 * 侧栏通用面板（标题 + 内容插槽）
 * 复用 .panel 全局卡片样式，标题带主题色竖条。
 */
const { title } = defineProps<{ title: string }>()
</script>

<template>
  <section class="panel sidebar-panel">
    <h3 class="panel-heading">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.sidebar-panel :deep(p) {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
