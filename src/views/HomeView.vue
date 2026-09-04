<script setup lang="ts">
/**
 * 首页
 *
 * 支持按标签过滤（侧栏标签云跳 /?tag=xxx），
 * 过滤后自动重置分页，避免出现「加载更多」把已过滤的文章又拉回来的问题。
 */
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CarouselBanner from '@/components/home/CarouselBanner.vue'
import PostCard from '@/components/home/PostCard.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { PAGE_SIZE, siteConfig } from '@/config/site'
import { usePostList } from '@/composables/usePostList'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { featuredPosts, sortedPosts } from '@/data/posts'

const route = useRoute()

/** 从查询参数读取标签，非法值一律视为「不过滤」 */
const activeTag = computed(() => {
  const tag = route.query.tag
  return typeof tag === 'string' && tag.trim() ? tag.trim() : ''
})

const filteredPosts = computed(() =>
  activeTag.value ? sortedPosts.filter((post) => post.tags.includes(activeTag.value)) : sortedPosts,
)

const { visible, hasMore, remaining, loadMore, reset } = usePostList(filteredPosts, PAGE_SIZE)

// 切换标签时回到第一页
watch(activeTag, () => reset())

useSeoMeta({
  title: computed(() =>
    activeTag.value
      ? `${activeTag.value} · ${siteConfig.name}`
      : `${siteConfig.fullName} —— ${siteConfig.tagline}`,
  ),
  description: siteConfig.description,
})
</script>

<template>
  <div class="layout__main">
    <div class="layout__content">
      <!-- 标签过滤时不展示轮播，避免与筛选结果语义冲突 -->
      <CarouselBanner v-if="!activeTag" :slides="featuredPosts" />

      <div v-if="activeTag" class="home__filter">
        <span>
          正在查看标签：
          <b>{{ activeTag }}</b>
        </span>
        <RouterLink class="home__filter-clear" :to="{ name: 'home' }">清除筛选</RouterLink>
      </div>

      <div class="card">
        <PostCard v-for="post in visible" :key="post.slug" :post="post" />

        <p v-if="!visible.length" class="home__empty">没有找到相关文章，换个标签试试。</p>
      </div>

      <button v-if="hasMore" class="load-more" type="button" @click="loadMore">
        加载更多（还有 {{ remaining }} 篇）
      </button>

      <p v-else-if="visible.length" class="home__end">已经到底啦</p>
    </div>

    <AppSidebar />
  </div>
</template>

<style scoped>
.home__filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 18px;
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.home__filter b {
  color: var(--brand);
}

.home__filter-clear {
  color: var(--text-secondary);
  transition: color var(--duration-base) var(--ease-standard);
}

.home__filter-clear:hover {
  color: var(--brand);
}

.home__empty,
.home__end {
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.load-more {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  font-size: 15px;
  color: var(--text-secondary);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-card);
  transition: color var(--duration-base) var(--ease-standard);
}

.load-more:hover {
  color: var(--brand);
}
</style>
