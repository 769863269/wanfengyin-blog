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
import { carouselPosts, sortedPosts } from '@/data/posts'

const route = useRoute()

/** 从查询参数读取标签，非法值一律视为「不过滤」 */
const activeTag = computed(() => {
  const tag = route.query.tag
  return typeof tag === 'string' && tag.trim() ? tag.trim() : ''
})

/** 从查询参数读取分类（Studio CMS 维护），可与标签叠加筛选 */
const activeCategory = computed(() => {
  const category = route.query.category
  return typeof category === 'string' && category.trim() ? category.trim() : ''
})

const filteredPosts = computed(() => {
  let list = sortedPosts
  if (activeTag.value) list = list.filter((post) => post.tags.includes(activeTag.value))
  if (activeCategory.value) list = list.filter((post) => post.category === activeCategory.value)
  return list
})

const { visible, hasMore, remaining, loadMore, reset } = usePostList(filteredPosts, PAGE_SIZE)

// 切换标签 / 分类时回到第一页
watch([activeTag, activeCategory], () => reset())

useSeoMeta({
  title: computed(() => {
    if (activeCategory.value) return `${activeCategory.value} · 分类 · ${siteConfig.name}`
    if (activeTag.value) return `${activeTag.value} · ${siteConfig.name}`
    return `${siteConfig.fullName} —— ${siteConfig.tagline}`
  }),
  description: siteConfig.description,
})
</script>

<template>
  <div class="layout__main">
    <div class="layout__content">
      <!-- 筛选状态（标签/分类）下不展示轮播，避免与筛选结果语义冲突 -->
      <CarouselBanner v-if="!activeTag && !activeCategory" :slides="carouselPosts" />

      <div v-if="activeTag || activeCategory" class="home__filter">
        <span>
          正在查看：
          <b v-if="activeTag">标签「{{ activeTag }}」</b>
          <b v-if="activeTag && activeCategory">＋</b>
          <b v-if="activeCategory">分类「{{ activeCategory }}」</b>
        </span>
        <RouterLink class="home__filter-clear" :to="{ name: 'home' }">清除筛选</RouterLink>
      </div>

      <div class="card">
        <PostCard v-for="post in visible" :key="post.slug" :post="post" />

        <p v-if="!visible.length" class="home__empty">没有找到相关文章，换个标签或分类试试。</p>
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
