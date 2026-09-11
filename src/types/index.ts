/**
 * 全局类型定义
 */

/* ===================== 文章 ===================== */

/**
 * 正文内容块。
 * 用结构化数据而非 HTML 字符串，渲染时无需 v-html，
 * 从根上杜绝 XSS，同时天然获得类型检查。
 * 三处受控例外（均为白名单产物，渲染端仍过一遍 DOMPurify）：
 *   - code.codeHtml —— 构建期 Shiki 高亮产物；
 *   - 行内格式 —— renderInline 先转义再挂白名单标签；
 *   - html.html —— 生成端 sanitizeHtmlBlock 净化的 HTML 片段。
 */
export type ArticleListItem = string | { text: string; children: string[]; childrenOrdered: boolean }

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; id: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'list'; ordered: boolean; items: ArticleListItem[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'code'; lang: string; text: string; /** 构建期 Shiki 高亮的 <code> 内部 HTML（可选，缺省走纯文本） */ codeHtml?: string }
  | { type: 'html'; /** 已按白名单净化的 HTML 片段（生成端 sanitizeHtmlBlock 产物） */ html: string }

/**
 * 文章元数据（不含正文）—— 列表页与首屏使用。
 *
 * 正文单独编译到 posts.body.generated.ts 按需加载：正文占全部文章数据的 97%，
 * 却只有详情页用得上；混在元数据里会让每个访客先下载全部文章全文。
 */
export interface PostSummary {
  /** URL 友好标识，同时用作路由参数 */
  slug: string
  title: string
  /** 列表页摘要 */
  excerpt: string
  /** 封面 / 缩略图。目前使用 CSS 渐变占位，可替换为真实图片地址 */
  cover: string
  /** ISO 8601 日期，相对时间由运行时计算 */
  publishedAt: string
  /** 发布时间 HH:mm（Studio CMS 首次发布时记录，排序与展示用；旧文可能为空） */
  publishedTime?: string
  /** 阅读数原始值，展示时格式化为 1.6k */
  views: number
  commentCount: number
  tags: string[]
  /**
   * 阅读时长（分钟）。构建期由 build-posts.mjs 算好，
   * 让归档页这类列表不必为了显示时长去加载正文。
   */
  readingMinutes: number
  /** 是否置顶轮播 */
  featured?: boolean
  /** 是否列表置顶（Studio CMS，置顶文章排在列表最前） */
  pinned?: boolean
  /** 分类（单分类体系，Studio CMS 维护） */
  category?: string
  /** 作者（Studio CMS 维护） */
  author?: string
  /** SEO 关键词（预渲染 meta keywords 用） */
  keywords?: string[]
  /** SEO 描述（Studio CMS 维护，留空用 excerpt） */
  seoDescription?: string
}

/** 文章详情：元数据 + 正文块（运行时由 loadPostBody 合并） */
export interface Post extends PostSummary {
  /** 正文内容块 */
  body: ArticleBlock[]
}

/* ===================== 自定义页面 ===================== */

/**
 * 后台「自定义页面」编译产物（content/pages/*.md → pages.generated.ts）。
 * 渲染复用 ArticleBody 的结构化块，与文章同一套净化与高亮链路。
 */
export interface CustomPage {
  /** URL 标识：content/pages/<slug>.md，对应前台 /page/<slug>，同时用作路由 name */
  slug: string
  title: string
  /** SEO 描述，选填 */
  description: string
  /** 正文内容块（构建期已编译，含 Shiki 高亮） */
  body: ArticleBlock[]
}

/* ===================== 侧边栏 ===================== */

export interface HotPost {
  slug: string
  title: string
}

export type TagName = string

/* ===================== 导航 ===================== */

/**
 * 导航项类型：
 * - route    站内路由
 * - external 外链
 * - disabled 功能未上线，渲染为不可点击的占位（避免死链 href="#"）
 */
export type NavItemKind = 'route' | 'external' | 'disabled' | 'hidden'

export interface NavItem {
  id: string
  label: string
  icon: string
  kind: NavItemKind
  /** route: 路由 name；external: 完整 URL；disabled: 为空 */
  to?: string
  href?: string
  /** 子菜单（递归）。顶栏父项滑过即展开（触屏点击切换）、抽屉父项点击折叠，本身不再跳转 */
  children?: NavItem[]
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
