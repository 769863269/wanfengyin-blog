<script setup lang="ts">
/**
 * 标签聚合页
 *
 * 全站标签按出现次数排序，点击进入首页对应标签筛选。
 */
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { posts } from '@/data/posts'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { siteConfig } from '@/config/site'

useSeoMeta({
  title: `标签 · ${siteConfig.name}`,
  description: `${siteConfig.fullName}的全部文章标签。`,
})

const router = useRouter()

function goBack(): void {
  if (router.options.history.state.back !== null) {
    router.back()
  } else {
    void router.push({ name: 'home' })
  }
}

/** 标签 → 文章数，降序；tagCloud 已按名称排好，这里按热度重排 */
const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

/** 热度 → 字号梯度（3 档） */
function sizeClass(count: number): string {
  const max = tagCounts.value[0]?.[1] ?? 1
  if (count >= Math.ceil(max * 0.6)) return 'is-lg'
  if (count >= 2) return 'is-md'
  return 'is-sm'
}
</script>

<template>
  <div class="layout__main">
    <div class="layout__content tags-page">
      <button class="tags-page__back" type="button" @click="goBack">
        <span aria-hidden="true">←</span>
        返回上一页
      </button>

      <div class="card">
        <header class="tags-page__header">
          <h1 class="tags-page__title">🏷 全部标签</h1>
          <p class="tags-page__desc">共 {{ tagCounts.length }} 个标签，点击查看同类文章</p>
        </header>

        <div class="tags-page__cloud">
          <RouterLink
            v-for="[tag, count] in tagCounts"
            :key="tag"
            class="tag-chip"
            :class="sizeClass(count)"
            :to="{ name: 'home', query: { tag } }"
          >
            #{{ tag }}
            <small>{{ count }}</small>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-page__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition:
    color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.tags-page__back:hover {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-soft);
}

.tags-page__header {
  margin-bottom: 22px;
}

.tags-page__title {
  margin-bottom: 6px;
  font-size: 22px;
  font-weight: 700;
}

.tags-page__desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.tags-page__cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-radius: var(--radius-pill);
  transition:
    color var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.tag-chip small {
  font-size: 11px;
  color: var(--text-tertiary);
}

.tag-chip:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.tag-chip.is-md {
  font-size: 15px;
}

.tag-chip.is-lg {
  padding: 6px 16px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
