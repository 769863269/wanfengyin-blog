<script setup lang="ts">
/**
 * 侧边栏
 * 数据全部来自 data/posts.ts 派生，新增文章时侧栏自动更新，
 * 不需要像原版那样手工同步热门文章 / 标签云。
 */
import { RouterLink } from 'vue-router'
import SidebarPanel from '@/components/layout/SidebarPanel.vue'
import { hotPosts, recentComments, tagCloud } from '@/data/posts'
import { siteConfig } from '@/config/site'
</script>

<template>
  <aside class="app-sidebar" aria-label="侧边栏">
    <SidebarPanel title="关于本站">
      <p>{{ siteConfig.name }} —— {{ siteConfig.tagline }}记录开发、生活与一点点技术碎碎念。</p>
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

    <SidebarPanel title="最新评论">
      <ul class="comment-list">
        <li v-for="comment in recentComments" :key="comment.id">
          <b>{{ comment.author }}</b>
          ：{{ comment.content }}
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

.comment-list li {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.comment-list b {
  color: var(--text-primary);
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
