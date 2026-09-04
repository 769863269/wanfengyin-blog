/**
 * 全局类型定义
 */

/* ===================== 文章 ===================== */

/**
 * 正文内容块。
 * 用结构化数据而非 HTML 字符串，渲染时无需 v-html，
 * 从根上杜绝 XSS，同时天然获得类型检查。
 */
export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'code'; lang: string; text: string }

export interface Post {
  /** URL 友好标识，同时用作路由参数 */
  slug: string
  title: string
  /** 列表页摘要 */
  excerpt: string
  /** 封面 / 缩略图。目前使用 CSS 渐变占位，可替换为真实图片地址 */
  cover: string
  /** ISO 8601 日期，相对时间由运行时计算 */
  publishedAt: string
  /** 阅读数原始值，展示时格式化为 1.6k */
  views: number
  commentCount: number
  tags: string[]
  /** 正文内容块 */
  body: ArticleBlock[]
  /** 是否置顶轮播 */
  featured?: boolean
}

/** 列表项：不含正文，减轻列表渲染负担 */
// 预留：接后端 / CMS 后列表接口返回此结构，前端组件无需改动
export type PostSummary = Omit<Post, 'body'>

/* ===================== 侧边栏 ===================== */

export interface HotPost {
  slug: string
  title: string
}

export interface RecentComment {
  id: string
  author: string
  content: string
}

export type TagName = string

/* ===================== 导航 ===================== */

/**
 * 导航项类型：
 * - route    站内路由
 * - external 外链
 * - disabled 功能未上线，渲染为不可点击的占位（避免死链 href="#"）
 */
export type NavItemKind = 'route' | 'external' | 'disabled'

export interface NavItem {
  id: string
  label: string
  icon: string
  kind: NavItemKind
  /** route: 路由 name；external: 完整 URL；disabled: 为空 */
  to?: string
  href?: string
  /** 移动端抽屉是否展示 */
  showOnMobile?: boolean
}

/* ===================== 站点配置 ===================== */

export interface SocialLink {
  id: string
  label: string
  href: string
  /** SVG path 数据 */
  iconPath: string
}

export interface GiscusConfig {
  enabled: boolean
  repo: string
  repoId: string
  category: string
  categoryId: string
}

/* ===================== UI ===================== */

export type ThemeMode = 'light' | 'dark'

/** 文章上下篇导航 */
export interface PostNeighbor {
  slug: string
  title: string
}
