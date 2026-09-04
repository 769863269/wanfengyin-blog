<script setup lang="ts">
/**
 * 文章详情页
 *
 * 数据层为本地静态数据，找不到 slug 时由路由层处理 404，
 * 这里只渲染存在的文章。评论区按当前路径动态挂载 Giscus。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ArticleBody from '@/components/article/ArticleBody.vue'
import CommentSection from '@/components/article/CommentSection.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { domain, siteConfig } from '@/config/site'
import { findPost, getNeighbors, postPlainText } from '@/data/posts'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { estimateReadingTime, formatCount, formatRelativeTime } from '@/utils/format'
import NotFoundView from './NotFoundView.vue'

const props = defineProps<{ slug: string }>()

const post = computed(() => findPost(props.slug))

const neighbors = computed(() => (post.value ? getNeighbors(post.value.slug) : undefined))

const readingTime = computed(() =>
  post.value ? estimateReadingTime(postPlainText(post.value)) : 0,
)

const canonicalUrl = computed(() => (post.value ? `${domain}/post/${post.value.slug}` : domain))

useSeoMeta({
  title: computed(() =>
    post.value ? `${post.value.title} · ${siteConfig.name}` : siteConfig.name,
  ),
  description: computed(() => post.value?.excerpt ?? siteConfig.description),
  type: 'article',
  url: canonicalUrl,
})
</script>

<template>
  <NotFoundView v-if="!post" />

  <div v-else class="layout__main">
    <div class="layout__content">
      <article class="card post-detail">
        <header class="post-detail__header">
          <h1 class="post-detail__title">{{ post.title }}</h1>
          <div class="post-detail__meta">
            <span>
              <span aria-hidden="true">🕒</span>
              <time :datetime="post.publishedAt">{{ formatRelativeTime(post.publishedAt) }}</time>
            </span>
            <span>
              <span aria-hidden="true">👁</span>
              {{ formatCount(post.views) }} 阅读
            </span>
            <span>
              <span aria-hidden="true">📖</span>
              约 {{ readingTime }} 分钟
            </span>
            <span>
              <span aria-hidden="true">💬</span>
              {{ post.commentCount }} 评论
            </span>
          </div>
        </header>

        <ArticleBody :blocks="post.body" />

        <footer class="post-detail__tags">
          <RouterLink
            v-for="tag in post.tags"
            :key="tag"
            class="tag-chip"
            :to="{ name: 'home', query: { tag } }"
          >
            #{{ tag }}
          </RouterLink>
        </footer>

        <!-- 上下篇导航 -->
        <nav v-if="neighbors" class="post-detail__neighbors" aria-label="文章导航">
          <RouterLink
            v-if="neighbors.prev"
            class="post-detail__neighbor post-detail__neighbor--prev"
            :to="{ name: 'post', params: { slug: neighbors.prev.slug } }"
          >
            <small>上一篇</small>
            <span>{{ neighbors.prev.title }}</span>
          </RouterLink>
          <span v-else />

          <RouterLink
            v-if="neighbors.next"
            class="post-detail__neighbor post-detail__neighbor--next"
            :to="{ name: 'post', params: { slug: neighbors.next.slug } }"
          >
            <small>下一篇</small>
            <span>{{ neighbors.next.title }}</span>
          </RouterLink>
          <span v-else />
        </nav>
      </article>

      <CommentSection />
    </div>

    <AppSidebar />
  </div>
</template>

<style scoped>
.post-detail__header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.post-detail__title {
  margin-bottom: 10px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.4;
}

.post-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.post-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.tag-chip {
  padding: 4px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-radius: var(--radius-pill);
  transition:
    color var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.tag-chip:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.post-detail__neighbors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.post-detail__neighbor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-base) var(--ease-standard);
}

.post-detail__neighbor:hover {
  background: var(--brand-soft);
}

.post-detail__neighbor small {
  font-size: 12px;
  color: var(--text-secondary);
}

.post-detail__neighbor span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.post-detail__neighbor--next {
  text-align: right;
}

@media (max-width: 600px) {
  .post-detail__neighbors {
    grid-template-columns: 1fr;
  }

  .post-detail__neighbor--next {
    text-align: left;
  }
}
</style>
