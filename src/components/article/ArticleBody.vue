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
</style>
