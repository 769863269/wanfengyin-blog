<script setup lang="ts">
/**
 * 归档页：按年份分组的时间线
 *
 * 数据全部从 sortedPosts 派生，新文章自动进入归档，无需维护。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { sortedPosts, postPlainText } from '@/data/posts'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { siteConfig } from '@/config/site'
import { estimateReadingTime } from '@/utils/format'

useSeoMeta({
  title: `归档 - ${siteConfig.name}`,
  description: `${siteConfig.name}的全部文章归档，按年份分组。`,
  type: 'website',
})

interface YearGroup {
  year: number
  total: number
  posts: { slug: string; title: string; date: string; minutes: number; tags: readonly string[] }[]
}

const groups = computed<YearGroup[]>(() => {
  const map = new Map<number, YearGroup>()

  for (const post of sortedPosts) {
    const year = new Date(post.publishedAt).getFullYear()
    let group = map.get(year)
    if (!group) {
      group = { year, total: 0, posts: [] }
      map.set(year, group)
    }
    group.total += 1
    group.posts.push({
      slug: post.slug,
      title: post.title,
      date: post.publishedAt.slice(5).replace('-', ' 月 ') + ' 日',
      minutes: estimateReadingTime(postPlainText(post)),
      tags: post.tags,
    })
  }

  // Map 按插入序遍历，sortedPosts 已按时间倒序，所以年份天然从新到旧
  return [...map.values()]
})

const totalPosts = computed(() => sortedPosts.length)
</script>

<template>
  <div class="archive layout__main">
    <div class="card archive-card">
      <header class="archive__header">
        <h1 class="archive__title">文章归档</h1>
        <p class="archive__summary">共 {{ totalPosts }} 篇文章</p>
      </header>

      <section v-for="group in groups" :key="group.year" class="archive__year">
        <h2 class="archive__year-label">
          {{ group.year }}
          <small>{{ group.total }} 篇</small>
        </h2>

        <ol class="archive__list">
          <li v-for="post in group.posts" :key="post.slug" class="archive__item">
            <time class="archive__date">{{ post.date }}</time>
            <RouterLink class="archive__link" :to="{ name: 'post', params: { slug: post.slug } }">
              {{ post.title }}
            </RouterLink>
            <span class="archive__meta">
              约 {{ post.minutes }} 分钟 · {{ post.tags.join(' / ') }}
            </span>
          </li>
        </ol>
      </section>

      <p v-if="!totalPosts" class="archive__empty">还没有文章，快去 articles/ 目录写第一篇吧。</p>
    </div>
  </div>
</template>

<style scoped>
.archive-card {
  padding: 32px 36px;
}

.archive__header {
  margin-bottom: 24px;
}

.archive__title {
  font-size: 24px;
  color: var(--text-primary);
}

.archive__summary {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.archive__year + .archive__year {
  margin-top: 28px;
}

.archive__year-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
  padding-left: 14px;
  font-size: 20px;
  color: var(--brand);
  border-left: 4px solid var(--brand);
}

.archive__year-label small {
  font-size: 12px;
  color: var(--text-muted);
}

.archive__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.archive__item {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 15px;
}

.archive__item:last-child {
  border-bottom: none;
}

.archive__date {
  flex-shrink: 0;
  min-width: 92px;
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.archive__link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

.archive__link:hover {
  color: var(--brand);
}

.archive__meta {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.archive__empty {
  color: var(--text-secondary);
}

@media (max-width: 600px) {
  .archive-card {
    padding: 24px 18px;
  }

  .archive__item {
    flex-wrap: wrap;
    gap: 4px 12px;
  }

  .archive__meta {
    margin-left: 0;
    width: 100%;
  }
}
</style>
