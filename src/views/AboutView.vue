<script setup lang="ts">
/**
 * 关于页
 *
 * 介绍博客与博主，列出技术栈。纯静态内容，数据取 siteConfig。
 */
import { RouterLink } from 'vue-router'
import { siteConfig } from '@/config/site'
import { posts } from '@/data/posts'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: `关于博客 · ${siteConfig.name}`,
  description: `关于 ${siteConfig.fullName}：定位、技术栈与联系方式的自我介绍。`,
})

const techStack = [
  { name: 'Vite 8（Rolldown）', role: '构建引擎，秒级冷启动' },
  { name: 'Vue 3.5', role: '<script setup> 组合式 API' },
  { name: 'TypeScript 6', role: 'strict 全开，类型即文档' },
  { name: 'Shiki', role: '构建期代码高亮，零运行时成本' },
  { name: 'Vitest + jsdom', role: '39 项单测 + 21 项冒烟回归' },
]

const milestones = [
  { date: '2026-04', text: '博客上线，第一篇文章发布' },
  { date: '2026-08', text: '整套架构从静态 HTML 迁移到 Vite + Vue 3 + TS，支持 Markdown 发文、RSS、预渲染与自动部署' },
]
</script>

<template>
  <div class="layout__main">
    <div class="layout__content about-page">
      <div class="card">
        <h1 class="about-page__title">ℹ️ 关于博客</h1>

        <section class="about-page__section">
          <h2>这个站是做什么的</h2>
          <p>
            {{ siteConfig.fullName }}，「{{ siteConfig.tagline }}」——
            记录开发中的实战笔记、踩坑复盘与一些技术碎碎念。
            目前已有 {{ posts.length }} 篇文章，持续更新中。
          </p>
        </section>

        <section class="about-page__section">
          <h2>技术栈</h2>
          <ul class="about-page__stack">
            <li v-for="item in techStack" :key="item.name">
              <strong>{{ item.name }}</strong>
              <span>{{ item.role }}</span>
            </li>
          </ul>
          <p class="about-page__hint">
            本站完全开源静态：Markdown 写文章，构建时编译 + 高亮 + 预渲染，
            没有后端、没有追踪脚本。
          </p>
        </section>

        <section class="about-page__section">
          <h2>大事记</h2>
          <ol class="about-page__timeline">
            <li v-for="item in milestones" :key="item.date">
              <time>{{ item.date }}</time>
              <span>{{ item.text }}</span>
            </li>
          </ol>
        </section>

        <section class="about-page__section">
          <h2>找到我</h2>
          <p>
            邮箱：<a :href="`mailto:${siteConfig.email}`">{{ siteConfig.email }}</a>
            ，或通过页脚的社交图标。订阅更新可
            <a href="/feed.xml">使用 RSS</a>，或去
            <RouterLink :to="{ name: 'archive' }">归档页</RouterLink>按时间浏览。
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page__title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
}

.about-page__section {
  margin-bottom: 26px;
}

.about-page__section:last-child {
  margin-bottom: 0;
}

.about-page__section h2 {
  margin-bottom: 10px;
  font-size: 17px;
  font-weight: 600;
}

.about-page__section p {
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-secondary);
}

.about-page__section a {
  color: var(--brand);
}

.about-page__section a:hover {
  text-decoration: underline;
}

.about-page__stack {
  display: grid;
  gap: 10px;
}

.about-page__stack li {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.about-page__stack strong {
  font-size: 14px;
  color: var(--text-primary);
}

.about-page__stack span {
  font-size: 13px;
  color: var(--text-secondary);
}

.about-page__hint {
  margin-top: 12px;
  font-size: 13px !important;
  color: var(--text-tertiary) !important;
}

.about-page__timeline {
  display: grid;
  gap: 10px;
}

.about-page__timeline li {
  display: flex;
  gap: 14px;
  align-items: baseline;
}

.about-page__timeline time {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}

.about-page__timeline span {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
