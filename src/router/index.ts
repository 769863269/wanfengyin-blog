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

/**
 * 待恢复的滚动位置（浏览器返回 / 前进时由 savedPosition 提供）。
 *
 * 页面切换用了 <Transition mode="out-in">：scrollBehavior 触发时新页面
 * 还没挂载、旧页面即将离场，此刻直接滚动会被旧页面高度截断而失效
 * （从文章详情返回首页时尤其明显——详情页比列表页矮）。
 * 因此这里只记录位置并返回 false 跳过路由器的自动滚动，
 * 由 App.vue 在新页面 enter 钩子里真正执行 window.scrollTo。
 */
let pendingRestore: { left: number; top: number } | undefined

/** App.vue 在页面过渡 enter 时调用：取走待恢复位置并清空 */
export function takePendingScroll(): { left: number; top: number } | undefined {
  const position = pendingRestore
  pendingRestore = undefined
  return position
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      pendingRestore = savedPosition
      // false = 本导航不自动滚动，交给 App.vue 在过渡后恢复
      return false
    }
    // 前进导航必须清掉残留的待恢复位置：若上一次「返回」落在被复用的
    // 同组件路由上（如首页 ↔ /?tag=x，无过渡、enter 钩子不触发），
    // 残留值会被下一次进入详情页的 enter 钩子误消费，导致页面自动
    // 滚到上一次离开的深处（表现为「进文章详情自动滚到底部」）。
    pendingRestore = undefined
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // 前进导航直接跳顶，不用平滑滚动：避免用户看到新页面「滑」上去
    return { top: 0 }
  },
})

export default router
