<script setup lang="ts">
/**
 * 自定义页面渲染器
 *
 * 数据源：content/pages/*.md → build-pages.mjs → pages.generated.ts。
 * ⚠️ 只有「已发布 且（已加入导航菜单 或 开启直接访问）」的页面才会出现在
 * generatedPages 里（规则见 scripts/lib/nav.mjs），其余连路由都不注册 →
 * 直接敲 URL 会落到 catch-all 404，这是「未上线页面无法用 URL 强行打开」的保证。
 * 这里额外做一层兜底：路由命中但数据缺失时给出提示页，而不是空白。
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
  title: page.value ? `${page.value.title} · ${siteConfig.name}` : `页面不存在 · ${siteConfig.name}`,
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
      <div v-else class="card custom-page__missing">
        <h1 class="custom-page__title">页面不存在或未上线</h1>
        <p class="custom-page__hint">
          该地址没有对应页面，可能尚未上线、已下线或已被删除。
          <RouterLink to="/">← 返回首页</RouterLink>
        </p>
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

.custom-page__missing .custom-page__title {
  margin-bottom: 0.75rem;
}

.custom-page__hint {
  color: #86868b;
  font-size: 0.9375rem;
  line-height: 1.7;
}

.custom-page__hint a {
  color: #0071e3;
}
</style>
