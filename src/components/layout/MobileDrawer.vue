<script setup lang="ts">
/**
 * 移动端侧滑抽屉
 *
 * 保留 ESC 关闭、点遮罩关闭、点链接关闭。
 * 相比原版补充：打开时把焦点移入抽屉、关闭后归还给触发按钮，
 * 键盘用户不会「掉焦」到页面顶部。
 */
import { nextTick, ref, watch } from 'vue'
import NavLink from '@/components/common/NavLink.vue'
import { drawerNav, siteConfig } from '@/config/site'
import { useDrawer } from '@/composables/useDrawer'

const { isOpen, close } = useDrawer()

const closeButtonRef = ref<HTMLButtonElement | null>(null)
/** 打开抽屉前的焦点元素，关闭后归还焦点 */
let lastFocused: HTMLElement | null = null

const currentYear = new Date().getFullYear()

watch(isOpen, async (open) => {
  if (open) {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    closeButtonRef.value?.focus()
    return
  }

  await nextTick()
  lastFocused?.focus()
  lastFocused = null
})
</script>

<template>
  <div
    id="mobile-drawer"
    class="drawer"
    :class="{ 'is-open': isOpen }"
    role="dialog"
    aria-modal="true"
    :aria-label="`${siteConfig.fullName}导航`"
    :aria-hidden="!isOpen"
  >
    <div class="drawer__head">
      <span class="drawer__title">{{ siteConfig.name }}</span>
      <button
        ref="closeButtonRef"
        class="drawer__close"
        type="button"
        aria-label="关闭菜单"
        @click="close"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>

    <ul class="drawer__list">
      <li v-for="item in drawerNav" :key="item.id">
        <NavLink :item="item" @click="close" />
      </li>
    </ul>

    <div class="drawer__foot">
      © {{ siteConfig.since }}-{{ currentYear }} {{ siteConfig.name }} 保留所有权利
    </div>
  </div>

  <div class="drawer-overlay" :class="{ 'is-visible': isOpen }" aria-hidden="true" @click="close" />
</template>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: var(--z-drawer);
  width: 78%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  box-shadow: var(--shadow-drawer);
  transform: translateX(-100%);
  transition: transform var(--duration-drawer) ease;
}

.drawer.is-open {
  transform: translateX(0);
}

.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
}

.drawer__close {
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  transition: color var(--duration-base) var(--ease-standard);
}

.drawer__close:hover {
  color: var(--brand);
}

.drawer__list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
  -webkit-overflow-scrolling: touch;
}

.drawer__list :deep(.nav-link) {
  display: block;
  width: 100%;
  padding: 15px 22px;
  font-size: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer__list :deep(.nav-link:active) {
  background: var(--bg-subtle);
  color: var(--brand);
}

.drawer__foot {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--bg-overlay);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--duration-drawer) ease;
}

.drawer-overlay.is-visible {
  opacity: 1;
  visibility: visible;
}

/* 抽屉仅在移动端存在；桌面端由顶栏承载导航 */
@media (min-width: 769px) {
  .drawer,
  .drawer-overlay {
    display: none;
  }
}
</style>
