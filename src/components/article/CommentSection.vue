<script setup lang="ts">
/**
 * 评论区
 *
 * 未配置 Giscus（config/site.ts 中 giscus.enabled = false）时显示占位。
 * 启用后按当前文章路径动态注入脚本 —— SPA 路由切换时 Giscus 不会自动
 * 重挂载，必须手动重建，否则评论区会停留在上一篇文章。
 */
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { giscus } from '@/config/site'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { isDark } = useTheme()

const containerRef = ref<HTMLElement | null>(null)

function mountGiscus(): void {
  const container = containerRef.value
  if (!container) return

  // 清空上一篇文章的评论节点
  container.replaceChildren()

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'

  script.dataset.repo = giscus.repo
  script.dataset.repoId = giscus.repoId
  script.dataset.category = giscus.category
  script.dataset.categoryId = giscus.categoryId
  script.dataset.mapping = 'pathname'
  script.dataset.strict = '0'
  script.dataset.reactionsEnabled = '1'
  script.dataset.emitMetadata = '0'
  script.dataset.inputPosition = 'bottom'
  script.dataset.theme = isDark.value ? 'dark' : 'light'
  script.dataset.lang = 'zh-CN'

  container.appendChild(script)
}

onMounted(() => {
  if (giscus.enabled) mountGiscus()
})

// 路由变化 → 换文章 → 重建评论；主题变化 → 换配色 → 同样重建
watch(
  () => [route.path, isDark.value] as const,
  () => {
    if (giscus.enabled) mountGiscus()
  },
)
</script>

<template>
  <section class="card comment-section">
    <h3 class="panel-heading">评论区</h3>

    <!-- 未启用时的占位 -->
    <div v-if="!giscus.enabled" class="comment-section__placeholder">
      <span class="comment-section__icon" aria-hidden="true">💬</span>
      <p class="comment-section__title">评论功能即将上线</p>
      <small>评论基于 Giscus（GitHub 登录，零后端）。配置完成后即可开启。</small>
    </div>

    <!-- Giscus 挂载点 -->
    <div v-else ref="containerRef" class="comment-section__giscus" />
  </section>
</template>

<style scoped>
.comment-section {
  margin-top: 24px;
}

.comment-section .panel-heading {
  margin-bottom: 18px;
}

.comment-section__placeholder {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}

.comment-section__icon {
  display: block;
  margin-bottom: 8px;
  font-size: 30px;
}

.comment-section__title {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.comment-section__placeholder small {
  font-size: 12px;
  line-height: 1.6;
}
</style>
