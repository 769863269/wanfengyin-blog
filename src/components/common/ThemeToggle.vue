<script setup lang="ts">
/**
 * 主题切换按钮
 *
 * 状态来自 useTheme() 单例，因此 PC 顶栏与移动端顶栏可以各放一个，
 * 两者永远同步 —— 原模板用 getElementById 只能绑到第一个按钮，
 * 导致 PC 端按钮失效，这里从根上避免了该问题。
 */
import { useTheme } from '@/composables/useTheme'

interface Props {
  /** 移动端加大触控区（≥44px） */
  touch?: boolean
}

const { touch = false } = defineProps<Props>()

const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    class="icon-button theme-toggle"
    :class="{ 'icon-button--touch': touch }"
    type="button"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :aria-pressed="isDark"
    @click="toggle"
  >
    <span aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  font-size: 18px;
}

.theme-toggle.icon-button--touch {
  font-size: 20px;
}
</style>
