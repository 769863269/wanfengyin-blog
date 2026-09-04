<script setup lang="ts">
/**
 * 应用根组件
 *
 * 职责单一：组合 Header / Drawer / RouterView / Footer，
 * 挂载主题监听器。具体布局由各子组件负责。
 */
import { onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import MobileDrawer from '@/components/layout/MobileDrawer.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import { useTheme } from '@/composables/useTheme'
import { useDrawer } from '@/composables/useDrawer'
import { useSearch } from '@/composables/useSearch'
import { takePendingScroll } from '@/router'

// 三个全局状态在根组件统一挂载，子组件各自 useXxx() 取同一实例
useTheme()
const drawer = useDrawer()
const search = useSearch()

/**
 * 页面过渡 enter 时恢复滚动位置（浏览器返回 / 前进）。
 * out-in 过渡下，此刻新页面已挂载、布局高度就绪，恢复才不会被截断。
 */
function onPageEnter(): void {
  const position = takePendingScroll()
  if (position) window.scrollTo(position.left, position.top)
}

onErrorCaptured((err) => {
  console.error('[App error]', err)
  // 返回 false 阻止继续向上抛，避免整页白屏
  return false
})
</script>

<template>
  <!-- 键盘用户跳过导航直达内容（a11y） -->
  <a class="skip-link" href="#main">跳到主内容</a>
  <AppHeader />
  <MobileDrawer v-model:open="drawer.isOpen.value" />
  <main id="main" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in" @enter="onPageEnter">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />
  <SearchModal v-model:open="search.isOpen.value" />
</template>

<style scoped>
/* main 聚焦时不显示轮廓（由 skip-link 触发，视觉无需强调） */
main:focus {
  outline: none;
}
</style>

<style scoped>
/* 路由切换淡入淡出，避免突兀刷新 */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
