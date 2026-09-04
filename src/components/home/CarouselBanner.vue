<script setup lang="ts">
/**
 * 首页轮播
 *
 * useCarousel 内部已处理：移动端暂停、悬停暂停、后台标签页暂停。
 * 移动端由 CSS 隐藏（原版行为），暂停逻辑避免定时器空转。
 */
import { RouterLink } from 'vue-router'
import { CAROUSEL_INTERVAL } from '@/config/site'
import { useCarousel } from '@/composables/useCarousel'
import { withBase } from '@/utils/asset'
import type { Post } from '@/types'

const { slides } = defineProps<{ slides: readonly Post[] }>()

const { activeIndex, isHovered, select, next, prev } = useCarousel(() => slides.length, CAROUSEL_INTERVAL)

/** 键盘可达性：聚焦轮播后方向键切换 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  }
}
</script>

<template>
  <section
    class="carousel"
    aria-roledescription="carousel"
    aria-label="精选文章，可用左右方向键切换"
    tabindex="0"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown="handleKeydown"
    @focusin="isHovered = true"
    @focusout="isHovered = false"
  >
    <div class="carousel__track" :style="{ transform: `translateX(${-activeIndex * 100}%)` }">
      <RouterLink
        v-for="(post, index) in slides"
        :key="post.slug"
        class="carousel__slide"
        :to="{ name: 'post', params: { slug: post.slug } }"
        role="group"
        :aria-roledescription="'slide'"
        :aria-label="`${index + 1} / ${slides.length}：${post.title}`"
        :aria-hidden="index !== activeIndex"
        :tabindex="index === activeIndex ? 0 : -1"
      >
        <div v-lazy-bg="withBase(post.cover)" class="carousel__bg" />
        <div class="carousel__text">
          <h3 class="carousel__title">{{ post.title }}</h3>
          <p class="carousel__desc">{{ post.excerpt }}</p>
        </div>
      </RouterLink>
    </div>

    <div class="carousel__dots">
      <button
        v-for="(post, index) in slides"
        :key="post.slug"
        class="carousel__dot"
        :class="{ 'is-active': index === activeIndex }"
        type="button"
        :aria-label="`切换到第 ${index + 1} 张：${post.title}`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="select(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.carousel {
  position: relative;
  overflow: hidden;
  margin-bottom: 28px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

/* 键盘 Tab 聚焦时的可见指示 */
.carousel:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.carousel__track {
  display: flex;
  transition: transform 0.5s ease;
}

.carousel__slide {
  position: relative;
  flex: 0 0 100%;
  height: 300px;
}

.carousel__bg {
  width: 100%;
  height: 100%;
  background-color: var(--bg-placeholder);
  background-size: cover;
  background-position: center;
}

.carousel__text {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 26px 28px;
  color: var(--text-on-gradient);
  background: linear-gradient(transparent, rgb(0 0 0 / 60%));
}

.carousel__title {
  margin-bottom: 6px;
  font-size: 22px;
}

.carousel__desc {
  font-size: 14px;
  opacity: 0.9;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.carousel__dots {
  position: absolute;
  right: 16px;
  bottom: 14px;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.carousel__dot {
  width: 9px;
  height: 9px;
  background: rgb(255 255 255 / 60%);
  border-radius: var(--radius-round);
  transition: all var(--duration-base) var(--ease-standard);
}

.carousel__dot:hover {
  background: rgb(255 255 255 / 85%);
}

.carousel__dot.is-active {
  width: 22px;
  background: var(--brand);
  border-radius: 5px;
}

@media (max-width: 768px) {
  /* 移动端不展示轮播（与 useCarousel 内的暂停逻辑呼应） */
  .carousel {
    display: none;
  }
}
</style>
