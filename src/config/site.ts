import type { GiscusConfig, NavItem, SocialLink } from '@/types'

/**
 * 站点全局配置
 *
 * ⚠️ 上线前必须替换的占位项（搜索 TODO 即可定位全部）：
 *   1. domain        —— 真实域名，影响 sitemap / og:image / 规范链接
 *   2. icp           —— 备案号
 *   3. giscus        —— 评论区配置，见 README
 *   4. 各类 disabled 导航项 —— 功能就绪后改为 route / external
 */

/** TODO: 以后绑定自定义域名时替换（当前为 GitHub Pages 项目页地址，含子路径） */
export const domain = 'https://wanfengyin-blog.vercel.app'

/**
 * 站点文案数据源：content/site.json（Studio 后台「站点设置」页维护，可增删改查）。
 * 本文件只保留结构映射与代码级配置（导航/社交图标/giscus），文本内容一律改 JSON。
 * 注意：本文件被 vite.config.ts 在 Node 侧引用，必须用相对路径导入。
 */
import siteData from '../../content/site.json'

export const siteConfig = {
  ...siteData.site,

  /** 放在 public/ 下，直接以 / 开头的绝对路径引用 */
  logo: '/logo.svg',
  favicon: '/favicon.svg',
}

/**
 * 导航菜单数据源：content/site.json（Studio 后台「站点设置」页维护，可增删改查）。
 * kind = 'route'   → target 为路由 name：内置 5 页（home/archive/tags/about/random）
 *                    或已发布自定义页面的 slug（路由 name = slug，见 router/index.ts）
 * kind = 'external'→ target 为链接（http(s):// 或 / 开头）
 * kind = 'disabled'→ 未上线占位，渲染为不可点击
 */
type SiteNavItem = {
  label: string
  icon?: string
  kind: 'route' | 'external' | 'disabled' | 'hidden'
  target: string
  showOnMobile?: boolean
}

function toNavItems(list: readonly SiteNavItem[], prefix: string): NavItem[] {
  return list.map((item, i) => ({
    id: `${prefix}-${i}`,
    label: item.label,
    icon: item.icon ?? '',
    kind: item.kind,
    ...(item.kind === 'route' ? { to: item.target } : {}),
    ...(item.kind === 'external' ? { href: item.target } : {}),
    showOnMobile: item.showOnMobile !== false,
  }))
}

/** web 顶栏主导航（hidden 项保留在配置里但不渲染；H5 抽屉里勾选了「H5」的也会出现） */
export const mainNav: readonly NavItem[] = toNavItems(siteData.mainNav as readonly SiteNavItem[], 'nav').filter(
  (item) => item.kind !== 'hidden',
)

/** H5 抽屉额外入口（仅移动端抽屉显示） */
export const mobileExtraNav: readonly NavItem[] = toNavItems(siteData.mobileExtraNav as readonly SiteNavItem[], 'mnav').filter(
  (item) => item.kind !== 'hidden',
)

/** 移动端抽屉：顶栏项（勾选 H5 的）+ 抽屉专属项 */
export const drawerNav: readonly NavItem[] = [...mainNav, ...mobileExtraNav].filter(
  (item) => item.showOnMobile !== false,
)

export const footerQuickLinks: readonly NavItem[] = [
  { id: 'f-home', label: '首页', icon: '', kind: 'route', to: 'home' },
  { id: 'f-tags', label: '标签', icon: '', kind: 'route', to: 'tags' },
  { id: 'f-archive', label: '归档', icon: '', kind: 'route', to: 'archive' },
  { id: 'f-about', label: '关于博客', icon: '', kind: 'route', to: 'about' },
] as const

/** 友情链接：content/site.json 维护，后台「站点设置」可增删改查 */
export const footerFriendLinks: readonly NavItem[] = siteData.friendLinks.map((l, i) => ({
  id: 'fr-' + i,
  label: l.label,
  icon: '',
  kind: 'external',
  href: l.href,
}))

/** 关于页内容：content/site.json 的 aboutPage（Studio 后台「站点设置 → 关于页内容」维护） */
export type AboutStackItem = { name: string; role: string }
export type AboutMilestone = { date: string; text: string }
export type AboutPageContent = { intro: string; techStack: AboutStackItem[]; milestones: AboutMilestone[] }

export const aboutPage: AboutPageContent = siteData.aboutPage

export const socialLinks: readonly SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    // TODO: 替换为主页地址
    href: 'https://github.com/769863269',
    iconPath:
      'M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z',
  },
  {
    id: 'rss',
    label: 'RSS 订阅',
    href: '/feed.xml',
    iconPath:
      'M4 11a9 9 0 0 1 9 9h2a11 11 0 0 0-11-11v2zm0-5a14 14 0 0 1 14 14h2a16 16 0 0 0-16-16v2zm2.5 11a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  },
  {
    id: 'email',
    label: '邮箱',
    href: `mailto:${siteConfig.email}`,
    iconPath:
      'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
  },
] as const

/**
 * Giscus 评论配置。
 * 去 https://giscus.app/zh-CN 生成后填入，并把 enabled 改为 true。
 */
export const giscus: GiscusConfig = {
  enabled: false,
  repo: 'YOUR_GITHUB_USER/YOUR_REPO',
  repoId: 'YOUR_REPO_ID',
  category: 'Announcements',
  categoryId: 'YOUR_CATEGORY_ID',
}

/** 首页每页文章数，超出部分靠「加载更多」分批展开 */
export const PAGE_SIZE = 4

/** 轮播自动播放间隔（毫秒） */
export const CAROUSEL_INTERVAL = 4000
