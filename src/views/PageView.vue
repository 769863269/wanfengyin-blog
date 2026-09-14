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

/**
 * 完整 HTML 独立页：用 iframe 隔离渲染用户写的整份 HTML 文档（含 script / style）。
 *
 * 为什么是「独立文件 + src」而不是 srcdoc（踩过的坑，勿回退）：
 *   srcdoc 子文档会继承父页 CSP，而多条 CSP 只能取交集（更严），iframe 的 `csp`
 *   属性只能追加限制、不能放宽 —— 父页 `script-src 'self'`（无 unsafe-inline）
 *   会把内联脚本直接拦掉。表现为「本地 dev（无 CSP 头）点得动、Vercel 上线点不动」。
 *   改成加载 public/page-html/<slug>.html 后，子文档用的是自己响应头里的 CSP
 *   （见 public/_headers 的 /page-html/* 规则）。
 *
 * 安全取舍：
 *  - iframe 保留 sandbox="allow-scripts"（不给 allow-same-origin）→ 脚本跑在
 *    opaque origin，拿不到主站 DOM / cookie / localStorage；
 *  - 该静态文件的响应头另带 CSP `sandbox allow-scripts` —— 即使有人直接打开
 *    /page-html/x.html，文档同样被强制进 opaque origin，不会变成同源存储里的注入点。
 */
const iframeAttrs = computed<Record<string, string> | null>(() =>
  page.value?.fullHtml
    ? { src: `/page-html/${page.value.slug}.html`, sandbox: 'allow-scripts' }
    : null,
)

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
        <iframe v-if="iframeAttrs" v-bind="iframeAttrs" class="full-html-frame" title="自定义 HTML 页面"></iframe>
        <ArticleBody v-else :blocks="page.body" />
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

/* 完整 HTML 独立页：iframe 占满卡片宽度，固定最小高度，自身内部滚动 */
.full-html-frame {
  width: 100%;
  min-height: 60vh;
  border: 0;
  border-radius: 16px;
  background: #fff;
  display: block;
}
</style>
