import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { sortedPosts } from '@/data/posts'

/**
 * 路由配置
 *
 * - history 模式：URL 干净，无 # 号
 * - 懒加载：文章详情页按需加载，减小首屏体积
 * - 滚动行为：切换路由回到顶部，锚点跳转保留 hash
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/post/:slug',
    name: 'post',
    component: () => import('@/views/PostView.vue'),
    props: true,
  },
  {
    path: '/archives',
    name: 'archive',
    component: () => import('@/views/ArchiveView.vue'),
  },
  {
    path: '/random',
    name: 'random',
    // 随机跳转：每次访问随机抽一篇文章
    redirect: () => {
      const first = sortedPosts[0]
      if (!first) return { name: 'home' }
      const idx = Math.floor(Math.random() * sortedPosts.length)
      const post = sortedPosts[idx]
      return post
        ? { name: 'post', params: { slug: post.slug } }
        : { name: 'post', params: { slug: first.slug } }
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

export default router
