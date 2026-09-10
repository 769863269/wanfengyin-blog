<script setup lang="ts">
/**
 * 自定义页面渲染器
 *
 * 数据源：content/pages/*.md → build-pages.mjs → pages.generated.ts。
 * 路由按 slug 一页一条注册（router/index.ts），meta.slug 带回标识；
 * 未注册的 slug 根本进不到这里（落到 catch-all 404）。
 * 正文复用 ArticleBody 的结构化块渲染，与文章同一套净化与高亮。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { generatedPages } from '@/data/pages.generated'
import { siteConfig } from '@/config/site'
import { useSeoMeta } from '@/composables/useSeoMeta'
import ArticleBody from '@/components/article/ArticleBody.vue'

const route = useRoute()

const page = computed(() => generatedPages.find((p) => p.slug === route.meta.slug))

useSeoMeta({
  title: page.value ? `${page.value.title} · ${siteConfig.name}` : `页面 · ${siteConfig.name}`,
  description: page.value?.description || `「${page.value?.title ?? ''}」页面`,
})
</script>

<template>
  <div class="layout__main">
    <div class="layout__content">
      <div v-if="page" class="card">
        <h1 class="custom-page__title">{{ page.title }}</h1>
        <ArticleBody :blocks="page.body" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-page__title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}
</style>
