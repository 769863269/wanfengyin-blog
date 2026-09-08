<script setup lang="ts">
/**
 * 侧边栏
 * 数据全部来自 data/posts.ts 派生，新增文章时侧栏自动更新，
 * 不需要像原版那样手工同步热门文章 / 标签云。
 */
import { RouterLink } from 'vue-router'
import SidebarPanel from '@/components/layout/SidebarPanel.vue'
import { categoryCloud, featuredPosts, hotPosts, tagCloud } from '@/data/posts'
import { siteConfig } from '@/config/site'
</script>

<template>
  <aside class="app-sidebar" aria-label="侧边栏">
    <SidebarPanel title="关于本站">
      <p>{{ siteConfig.name }} —— {{ siteConfig.tagline }}{{ siteConfig.about }}</p>
    </SidebarPanel>

    <SidebarPanel title="热门文章">
      <ul class="hot-list">
        <li v-for="(post, index) in hotPosts" :key="post.slug">
          <span class="hot-list__num">{{ index + 1 }}</span>
          <RouterLink :to="{ name: 'post', params: { slug: post.slug } }">
            {{ post.title }}
          </RouterLink>
        </li>
      </ul>
    </SidebarPanel>

    <SidebarPanel v-if="featuredPosts.length" title="推荐阅读">
      <ul class="pick-list">
        <li v-for="post in featuredPosts" :key="post.slug">
          <RouterLink :to="{ name: 'post', params: { slug: post.slug } }">
            <span class="pick-list__mark" aria-hidden="true">荐</span>
            {{ post.title }}
          </RouterLink>
        </li>
      </ul>
    </SidebarPanel>

    <SidebarPanel v-if="categoryCloud.length" title="分类">
      <ul class="cat-list">
        <li v-for="cat in categoryCloud" :key="cat.name">
          <RouterLink :to="{ name: 'home', query: { category: cat.name } }">
            {{ cat.name }}
          </RouterLink>
          <small>{{ cat.count }}</small>
        </li>
      </ul>
    </SidebarPanel>

    <SidebarPanel title="标签云">
      <div class="tag-cloud">
        <RouterLink
          v-for="tag in tagCloud"
          :key="tag"
          class="tag-cloud__item"
          :to="{ name: 'home', query: { tag } }"
        >
          # {{ tag }}
        </RouterLink>
      </div>
    </SidebarPanel>
  </aside>
</template>

<style scoped>
.hot-list li {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.hot-list a {
  color: var(--text-secondary);
  transition: color var(--duration-base) var(--ease-standard);
}

.hot-list a:hover {
  color: var(--brand);
}

.hot-list__num {
  margin-right: 6px;
  font-weight: 700;
  color: var(--brand);
}

.pick-list li {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.pick-list a {
  color: var(--text-secondary);
  transition: color var(--duration-base) var(--ease-standard);
}

.pick-list a:hover {
  color: var(--brand);
}

.pick-list__mark {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #8b5a2b;
  background: rgb(201 182 164 / 28%);
  border: 1px solid rgb(139 115 85 / 45%);
  border-radius: var(--radius-pill);
}

.cat-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.cat-list a {
  color: var(--text-secondary);
  transition: color var(--duration-base) var(--ease-standard);
}

.cat-list a:hover {
  color: var(--brand);
}

.cat-list small {
  color: var(--text-tertiary, var(--text-secondary));
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-cloud__item {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-radius: var(--radius-pill);
  transition: all var(--duration-base) var(--ease-standard);
}

.tag-cloud__item:hover {
  color: var(--brand-contrast);
  background: var(--brand);
}
</style>
