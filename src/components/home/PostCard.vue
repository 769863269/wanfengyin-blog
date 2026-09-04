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
  padding-bottom: 30px;
  margin-bottom: 32px;
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

/* 波浪分隔线：站点的标志性细节。
   用 SVG 波纹线而非 emoji（〰️ 在 Windows 上走彩色 emoji 字体，
   渐变裁剪失效，观感像贴纸与文章行脱节）；
   间距上紧贴所属卡片（行尾 10px），与下一行留出大间隙，读作「行的一部分」。 */
.post-card::after {
  content: '';
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
  height: 6px;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='6' viewBox='0 0 36 6'%3E%3Cpath d='M0 3 Q9 0.4 18 3 T36 3' fill='none' stroke='%23c9b6a4' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E")
    repeat-x left center;
  opacity: 0.75;
  transition: opacity var(--duration-slow) var(--ease-standard);
}

.post-card:hover::after {
  opacity: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='6' viewBox='0 0 36 6'%3E%3Cpath d='M0 3 Q9 0.4 18 3 T36 3' fill='none' stroke='%238b7355' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
}

/* 波浪线现在是行的一部分（行尾装饰），每一行都有，包括最后一行 */

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
