<script setup lang="ts">
/**
 * 文章正文渲染
 *
 * 结构化 block 渲染，仅两处例外使用受控 HTML：
 *   - heading 的 id（构建期生成的 sec-N 锚点）；
 *   - code 的 codeHtml（构建期 Shiki 高亮产物，token span 已转义）。
 * 其余一律文本插值，杜绝 XSS。
 */
import { ref } from 'vue'
import type { ArticleBlock } from '@/types'

const { blocks } = defineProps<{ blocks: readonly ArticleBlock[] }>()

/** 目录跳转 / 侧栏交互后代码块复制按钮的状态 */
const copiedSlug = ref('')

async function copyCode(block: Extract<ArticleBlock, { type: 'code' }>): Promise<void> {
  try {
    await navigator.clipboard.writeText(block.text)
  } catch {
    // 非安全上下文 / 旧浏览器兜底
    const textarea = document.createElement('textarea')
    textarea.value = block.text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  copiedSlug.value = block.text
  setTimeout(() => {
    if (copiedSlug.value === block.text) copiedSlug.value = ''
  }, 1500)
}
</script>

<template>
  <div class="article-body">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.type === 'paragraph'">{{ block.text }}</p>

      <h2 v-else-if="block.type === 'heading'" :id="block.id" class="article-body__heading">
        {{ block.text }}
      </h2>

      <blockquote v-else-if="block.type === 'quote'" class="article-body__quote">
        {{ block.text }}
      </blockquote>

      <figure v-else-if="block.type === 'image'" class="article-body__figure">
        <img :src="block.src" :alt="block.alt" loading="lazy" decoding="async" />
      </figure>

      <div v-else-if="block.type === 'code'" class="article-body__codewrap">
        <!-- eslint-disable-next-line vue/no-v-html -- codeHtml 为构建期 Shiki 产物，token 内容已在构建时转义 -->
        <pre class="article-body__code" :data-lang="block.lang"><code v-if="block.codeHtml" v-html="block.codeHtml" /><code v-else>{{ block.text }}</code></pre>

        <button
          class="article-body__copy"
          :class="{ 'is-done': copiedSlug === block.text }"
          type="button"
          :aria-label="copiedSlug === block.text ? '已复制' : '复制代码'"
          @click="copyCode(block)"
        >
          {{ copiedSlug === block.text ? '已复制' : '复制' }}
        </button>
      </div>
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
  /* 锚点跳转不被吸顶导航遮住 */
  scroll-margin-top: 80px;
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
.article-body__codewrap {
  position: relative;
  margin: 18px 0 22px;
}

.article-body__code {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  font-size: 13.5px;
  line-height: 1.7;
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  color: #e8eaed;
  background: #1e2028;
  border-radius: var(--radius-md);
}

/* 语言标签：左上角小徽标（右上角让位给复制按钮） */
.article-body__code::before {
  content: attr(data-lang);
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: rgb(255 255 255 / 45%);
  text-transform: uppercase;
  user-select: none;
}

/* 语言徽标是绝对定位，代码首行给它留出空隙 */
.article-body__code code {
  display: block;
  padding-top: 14px;
  font-family: inherit;
}

/* Shiki token：与深底配色一致（github-dark） */
.article-body__code :deep(code) {
  background: transparent;
}

.article-body__copy {
  position: absolute;
  top: 8px;
  right: 10px;
  padding: 3px 10px;
  font-size: 12px;
  color: rgb(255 255 255 / 60%);
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.article-body__copy:hover {
  color: #fff;
  background: rgb(255 255 255 / 16%);
}

.article-body__copy.is-done {
  color: #4ade80;
  border-color: rgb(74 222 128 / 40%);
}
</style>
