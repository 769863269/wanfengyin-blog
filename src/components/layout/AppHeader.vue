<script setup lang="ts">
/**
 * 顶部导航栏
 *
 * PC 与移动端两套布局由 CSS 媒体查询切换（不依赖 JS 判断视口），
 * 避免首屏闪烁。两套各有一个搜索按钮和主题按钮，
 * 状态均来自单例 composable，天然同步。
 */
import { RouterLink } from 'vue-router'
import NavLink from '@/components/common/NavLink.vue'
import SiteLogo from '@/components/common/SiteLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { mainNav, siteConfig } from '@/config/site'
import { useDrawer } from '@/composables/useDrawer'
import { useSearch } from '@/composables/useSearch'

const { open: openSearch } = useSearch()
const { isOpen: isDrawerOpen, open: openDrawer } = useDrawer()
</script>

<template>
  <header class="app-header">
    <!-- ===== PC 顶栏（≤768px 时由 CSS 隐藏） ===== -->
    <nav class="app-header__bar app-header__bar--pc" :aria-label="`${siteConfig.fullName}主导航`">
      <div class="app-header__inner">
        <RouterLink class="app-header__brand" :to="{ name: 'home' }">
          <SiteLogo />
        </RouterLink>

        <ul class="nav-menu">
          <li v-for="item in mainNav" :key="item.id">
            <NavLink :item="item" />
          </li>
        </ul>

        <div class="app-header__actions">
          <button class="icon-button" type="button" aria-label="打开搜索" @click="openSearch">
            <span aria-hidden="true">🔍</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>

    <!-- ===== 移动端顶栏（＞768px 时由 CSS 隐藏） ===== -->
    <div class="app-header__bar app-header__bar--mobile">
      <button
        class="icon-button icon-button--touch app-header__hamburger"
        type="button"
        aria-label="打开菜单"
        aria-controls="mobile-drawer"
        :aria-expanded="isDrawerOpen"
        @click="openDrawer"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <RouterLink class="app-header__brand" :to="{ name: 'home' }">
        <SiteLogo />
      </RouterLink>

      <div class="app-header__actions">
        <button
          class="icon-button icon-button--touch"
          type="button"
          aria-label="打开搜索"
          @click="openSearch"
        >
          <span aria-hidden="true">🔍</span>
        </button>
        <ThemeToggle touch />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--bg-surface);
  box-shadow: var(--shadow-header);
}

.app-header__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  height: var(--header-height-pc);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.nav-menu {
  display: flex;
  gap: 6px;
}

.nav-menu :deep(.nav-link) {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 15px;
  transition:
    color var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.nav-menu :deep(.nav-link:hover),
.nav-menu :deep(.nav-link.router-link-active) {
  color: var(--brand);
  background: var(--brand-soft);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}

/* 移动端顶栏：默认隐藏 */
.app-header__bar--mobile {
  display: none;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height-mobile);
  padding: 0 12px;
}

.app-header__hamburger {
  font-size: 22px;
}

@media (max-width: 768px) {
  .app-header__bar--pc {
    display: none;
  }

  .app-header__bar--mobile {
    display: flex;
  }

  .app-header__brand :deep(.site-logo) {
    height: 30px;
  }
}
</style>
