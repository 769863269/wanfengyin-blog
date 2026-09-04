<script setup lang="ts">
/**
 * 文章正文渲染
 *
 * 按结构化 block 渲染而非 v-html：
 *   - 内容来源即便将来换成接口 / 用户投稿，也没有 XSS 风险；
 *   - 每个 block 类型有对应的语义标签（p / h2 / blockquote / figure）。
 */
import type { ArticleBlock } from '@/types'

const { blocks } = defineProps<{ blocks: readonly ArticleBlock[] }>()
</script>

<template>
  <div class="article-body">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.type === 'paragraph'">{{ block.text }}</p>

      <h2 v-else-if="block.type === 'heading'" class="article-body__heading">{{ block.text }}</h2>

      <blockquote v-else-if="block.type === 'quote'" class="article-body__quote">
        {{ block.text }}
      </blockquote>

      <figure v-else-if="block.type === 'image'" class="article-body__figure">
        <img :src="block.src" :alt="block.alt" loading="lazy" decoding="async" />
      </figure>

      <pre v-else-if="block.type === 'code'" class="article-body__code" :data-lang="block.lang"><code>{{ block.text }}</code></pre>
    </template>
  </div>
</template>

<style scoped>
.article-body {
  font-size: 16px;
  line-height: 1.9;
  color: var(--text-primary);
}

.article-body p {
  margin-bottom: 18px;
}

.article-body__heading {
  margin: 28px 0 12px;
  font-size: 20px;
}

.article-body__quote {
  margin: 18px 0;
  padding: 12px 16px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-left: 4px solid var(--brand);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.article-body__figure {
  margin: 18px 0;
}

.article-body__figure img {
  width: 100%;
  border-radius: var(--radius-md);
}

/* 深色代码块：浅色主题下也保持深底，阅读代码更聚焦 */
.article-body__code {
  position: relative;
  margin: 18px 0 22px;
  padding: 16px 18px;
  overflow-x: auto;
  font-size: 13.5px;
  line-height: 1.7;
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  color: #e8eaed;
  background: #1e2028;
  border-radius: var(--radius-md);
}

/* 语言标签：右上角小徽标 */
.article-body__code::before {
  content: attr(data-lang);
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: rgb(255 255 255 / 45%);
  text-transform: uppercase;
  user-select: none;
}

.article-body__code code {
  font-family: inherit;
}
</style>
