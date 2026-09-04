<script setup lang="ts">
/**
 * 404 页面
 *
 * 给出回首页入口，避免死胡同。
 */
import { RouterLink } from 'vue-router'
import { siteConfig } from '@/config/site'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: `页面不存在 · ${siteConfig.name}`,
  description: '您访问的页面不存在或已被移动。',
})
</script>

<template>
  <div class="not-found card">
    <p class="not-found__code" aria-hidden="true">404</p>
    <h1 class="not-found__title">页面走丢了</h1>
    <p class="not-found__desc">您访问的页面不存在，或者已被移动。</p>
    <RouterLink class="not-found__back" :to="{ name: 'home' }">回到首页</RouterLink>
  </div>
</template>

<style scoped>
/* 独立路由时约束宽度，与首页/文章页视觉一致（PostView 内嵌时同样适用） */
.not-found {
  max-width: var(--container-max);
  margin: 40px auto 0;
  padding: 60px 24px;
  text-align: center;
}

.not-found__code {
  font-size: 72px;
  font-weight: 800;
  color: var(--brand);
  line-height: 1;
  margin-bottom: 16px;
}

.not-found__title {
  font-size: 22px;
  margin-bottom: 8px;
}

.not-found__desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.not-found__back {
  display: inline-block;
  padding: 10px 24px;
  color: #fff;
  background: var(--brand);
  border-radius: var(--radius-pill);
  transition: opacity var(--duration-base) var(--ease-standard);
}

.not-found__back:hover {
  opacity: 0.9;
}
</style>
