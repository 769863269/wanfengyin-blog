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
import { takePendingScroll } from '@/router'

// 主题在这里挂一次即完成初始化（模块级单例，子组件各自 useTheme() 拿到同一份状态）
useTheme()

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
  <!-- MobileDrawer / SearchModal 都不接收 props：它们各自 useDrawer() / useSearch()
       直接取同一个模块级单例状态。此前误挂了 v-model:open，而组件既没有
       defineProps 也没有 defineEmits —— 那行绑定不产生任何效果，还写向
       readonly 状态（一旦组件补上 emit 就会触发 Vue 的只读警告）。 -->
  <MobileDrawer />
  <main id="main" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in" @enter="onPageEnter">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />
  <SearchModal />
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
