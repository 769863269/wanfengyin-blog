<script setup lang="ts">
/**
 * 文章卡片（首页列表项）
 *
 * 语义修正：原版列表标题用 <h1>，一页出现多个 h1 会让读屏软件的
 * 标题大纲失效。列表项统一用 <h2>，页面级 h1 由详情页承载。
 * 时间用 <time datetime>，机器可读。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCount, formatRelativeTime } from '@/utils/format'
import type { Post } from '@/types'

const { post } = defineProps<{ post: Post }>()

const hasThumb = computed(() => Boolean(post.cover))
const relativeTime = computed(() => formatRelativeTime(post.publishedAt))
const viewCount = computed(() => formatCount(post.views))
</script>

<template>
  <article class="post-card">
    <RouterLink class="post-card__link" :to="{ name: 'post', params: { slug: post.slug } }">
      <h2 class="post-card__title">{{ post.title }}</h2>

      <div class="post-card__preview" :class="{ 'post-card__preview--nothumb': !hasThumb }">
        <p class="post-card__excerpt">{{ post.excerpt }}</p>
        <div
          v-if="hasThumb"
          v-lazy-bg="post.cover"
          class="post-card__thumb"
          role="img"
          :aria-label="`${post.title} 封面`"
        />
      </div>

      <div class="post-card__meta">
        <span>
          <span aria-hidden="true">🕒</span>
          <time :datetime="post.publishedAt">{{ relativeTime }}</time>
        </span>
        <span>
          <span aria-hidden="true">👁</span>
          {{ viewCount }} 阅读
        </span>
        <span>
          <span aria-hidden="true">💬</span>
          {{ post.commentCount }} 评论
        </span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.post-card {
  position: relative;
  padding-bottom: 35px;
  margin-bottom: 35px;
}

.post-card__link {
  display: block;
}

.post-card__title {
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 700;
  transition: color var(--duration-base) var(--ease-standard);
}

.post-card__link:hover .post-card__title {
  color: var(--brand);
}

.post-card__preview {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.post-card__excerpt {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-secondary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.post-card__thumb {
  flex: 0 0 var(--thumb-width);
  width: var(--thumb-width);
  height: var(--thumb-height);
  background-color: var(--bg-placeholder);
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-md);
  transition: transform var(--duration-slow) var(--ease-standard);
}

.post-card__link:hover .post-card__thumb {
  transform: scale(1.02);
}

.post-card__preview--nothumb {
  display: block;
}

.post-card__preview--nothumb .post-card__excerpt {
  -webkit-line-clamp: 4;
  line-clamp: 4;
}

.post-card__meta {
  display: flex;
  gap: 28px;
  padding-top: 14px;
}

.post-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 波浪分隔线：站点的标志性细节 */
.post-card::after {
  content: '〰️ 〰️ 〰️ 〰️ 〰️';
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 100%;
  font-size: 20px;
  letter-spacing: 6px;
  text-align: center;
  opacity: 0.7;
  background: linear-gradient(90deg, #d4c5b9, #8b7355, #d4c5b9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all var(--duration-slow) ease;
}

.post-card:hover::after {
  opacity: 1;
  font-size: 22px;
  letter-spacing: 8px;
  background: linear-gradient(90deg, #8b7355, #d4c5b9, #8b7355);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 最后一张卡片不显示分隔线 */
.post-card:last-child::after {
  display: none;
}

@media (max-width: 992px) {
  .post-card__thumb {
    flex-basis: 130px;
    width: 130px;
    height: 85px;
  }
}

@media (max-width: 600px) {
  .post-card__preview {
    flex-direction: column;
  }

  .post-card__thumb {
    flex-basis: auto;
    width: 100%;
    height: 170px;
  }

  .post-card__meta {
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>
