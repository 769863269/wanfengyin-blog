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
 * 安全取舍（关键）：
 *  - srcdoc 把内容关进独立文档环境，脚本只在沙箱内执行，碰不到主站 DOM / 同源 cookie；
 *  - sandbox 只给 allow-scripts（不给 allow-same-origin）→ 脚本跑在 opaque origin，
 *    拿不到父页面任何凭据，爆炸半径锁死在沙箱内；
 *  - csp 属性给子文档一条宽松策略（放行内联脚本/样式与图片），覆盖父站继承来的
 *    `script-src 'self'`（否则内联 <script> 会被拦，交互出不来）。
 */
const iframeAttrs = computed<Record<string, string> | null>(() =>
  page.value?.fullHtml && page.value.rawHtml != null
    ? {
        srcdoc: page.value.rawHtml,
        sandbox: 'allow-scripts',
        csp: "default-src 'self' 'unsafe-inline' https: data:; script-src 'unsafe-inline' 'self' https:; style-src 'unsafe-inline' 'self' https:; img-src 'self' data: https:; frame-src 'self' data: blob:",
      }
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
