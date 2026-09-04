<script setup lang="ts">
/**
 * 站内搜索弹窗
 *
 * 相比原版（在首页过滤下方列表）的两点改进：
 *   1. 任何页面都能搜索，不再局限于首页；
 *   2. 直接展示结果列表并可点击直达，而不是「过滤当前页」这种隐晦交互。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { sortedPosts } from '@/data/posts'
import { useSearch } from '@/composables/useSearch'
import { searchPosts } from '@/utils/search'
import { formatDate } from '@/utils/format'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'

const MAX_RESULTS = 8

const router = useRouter()
const { isOpen, keyword, close } = useSearch()

const inputRef = ref<HTMLInputElement | null>(null)

const query = computed(() => keyword.value.trim())
const results = computed(() => {
  if (!query.value) return []
  return searchPosts(sortedPosts, query.value).slice(0, MAX_RESULTS)
})
const totalMatched = computed(() =>
  query.value ? searchPosts(sortedPosts, query.value).length : 0,
)

watch(isOpen, async (open) => {
  // 弹窗期间锁定页面滚动，避免背景跟着滚
  if (open) lockBodyScroll()
  else unlockBodyScroll()

  if (!open) return
  // 等元素挂载完成再聚焦，否则 inputRef 仍为 null
  await nextTick()
  inputRef.value?.focus()
})

function goToPost(slug: string): void {
  close()
  void router.push({ name: 'post', params: { slug } })
}

/**
 * 标题关键词高亮：先转义 HTML，再把命中词包上 <mark>。
 * 转义在前保证注入内容无法脱离文本节点，<mark> 是唯一引入的标签。
 */
function highlightTitle(title: string): string {
  const escaped = title
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
  const pattern = query.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!pattern) return escaped
  return escaped.replace(new RegExp(pattern, 'gi'), (match) => `<mark>${match}</mark>`)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  // 组件卸载时若弹窗仍开着，必须释放滚动锁，否则页面永久锁死
  if (isOpen.value) unlockBodyScroll()
})
</script>

<template>
  <div
    v-if="isOpen"
    class="search-modal"
    role="dialog"
    aria-modal="true"
    aria-label="站内搜索"
    @click.self="close"
  >
    <div class="search-modal__box">
      <span class="search-modal__icon" aria-hidden="true">🔍</span>

      <input
        ref="inputRef"
        v-model="keyword"
        class="search-modal__input"
        type="search"
        placeholder="搜索文章标题或内容…"
        aria-label="搜索关键词"
        autocomplete="off"
      />

      <button class="search-modal__close" type="button" aria-label="关闭搜索" @click="close">
        <span aria-hidden="true">✕</span>
      </button>
    </div>

    <!-- 结果区：有关键词时才渲染 -->
    <div v-if="query" class="search-modal__panel">
      <p class="search-modal__info">
        {{ totalMatched > 0 ? `找到 ${totalMatched} 篇相关文章` : '没有找到相关文章' }}
      </p>

      <ul v-if="results.length" class="search-modal__results">
        <li v-for="post in results" :key="post.slug">
          <button class="search-modal__result" type="button" @click="goToPost(post.slug)">
            <!-- eslint-disable-next-line vue/no-v-html -- 先转义后包 mark，无注入面 -->
            <span class="search-modal__result-title" v-html="highlightTitle(post.title)" />
            <span class="search-modal__result-meta">{{ formatDate(post.publishedAt) }}</span>
          </button>
        </li>
      </ul>

      <p v-if="totalMatched > results.length" class="search-modal__more">
        仅显示前 {{ results.length }} 条，输入更精确的关键词以缩小范围
      </p>
    </div>
  </div>
</template>

<style scoped>
.search-modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12vh;
  background: var(--bg-overlay);
  -webkit-overflow-scrolling: touch;
}

.search-modal__box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(90%, 560px);
  padding: 10px 18px;
  background: var(--bg-surface);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-float);
}

.search-modal__icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.search-modal__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
}

.search-modal__close {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--text-secondary);
  border-radius: var(--radius-round);
  transition: color var(--duration-base) var(--ease-standard);
}

.search-modal__close:hover {
  color: var(--brand);
}

.search-modal__panel {
  width: min(90%, 560px);
  margin-top: 14px;
  padding: 14px 18px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-float);
}

.search-modal__info {
  font-size: 13px;
  color: var(--text-secondary);
}

.search-modal__results {
  margin-top: 8px;
  max-height: 46vh;
  overflow-y: auto;
}

.search-modal__result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 8px;
  text-align: left;
  border-radius: var(--radius-card);
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.search-modal__result:hover {
  background: var(--brand-soft);
}

.search-modal__result-title {
  font-size: 15px;
  color: var(--text-primary);
}

.search-modal__result-title :deep(mark) {
  padding: 0 1px;
  color: var(--brand);
  font-weight: 700;
  background: var(--brand-soft);
  border-radius: 3px;
}

.search-modal__result:hover .search-modal__result-title {
  color: var(--brand);
}

.search-modal__result-meta {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.search-modal__more {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
