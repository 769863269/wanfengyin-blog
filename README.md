# 晚风吟个人开发博客（Vue 3 版）

仿 Typecho/OneBlog 风格的个人开发博客，基于 **Vite + Vue 3 + TypeScript** 重构。

原静态 HTML 版完整保留在 [`legacy-static/`](./legacy-static/)，可随时对照或回退。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 构建 | Vite 8（Rolldown） |
| 框架 | Vue 3.5（`<script setup>` 组合式 API） |
| 语言 | TypeScript 6，`strict` 全开 |
| 路由 | vue-router 5（history 模式，懒加载） |
| 代码规范 | ESLint 10（flat config）+ Prettier 3 + EditorConfig |

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器
npm run build      # 类型检查 + 生产构建（产物在 dist/）
npm run preview    # 预览生产构建
```

## 质量保障

```bash
npm run lint       # ESLint 检查
npm run lint:fix   # 自动修复
npm run format     # Prettier 统一格式
npm run type-check # vue-tsc 类型检查
npm run smoke      # jsdom 冒烟测试（挂载/主题/搜索/路由/加载更多）
```

冒烟测试说明：jsdom 不执行 `<script type="module">`，故 `npm run smoke`
先用 `vite.smoke.config.ts` 打一个 IIFE 单文件测试包到 `dist-smoke/`（已 gitignore），
再由 `scripts/smoke.mjs` 在 jsdom 中挂载完整应用并逐项断言核心交互。

## 目录结构

```
├── public/                 # 静态资源（favicon、logo，原样输出）
├── scripts/
│   └── smoke.mjs           # jsdom 冒烟测试
├── legacy-static/          # 原静态版备份（仅存档，不参与构建）
├── src/
│   ├── components/
│   │   ├── article/        # ArticleBody、CommentSection
│   │   ├── common/         # BaseIcon、ThemeToggle、NavLink、SiteLogo、SearchModal
│   │   ├── home/           # CarouselBanner、PostCard
│   │   └── layout/         # AppHeader、MobileDrawer、AppSidebar、AppFooter…
│   ├── composables/        # useTheme、useSearch、useCarousel、usePostList…
│   ├── config/site.ts      # 站点信息集中配置
│   ├── data/posts.ts       # 文章数据（类型安全）
│   ├── directives/lazyBg.ts# v-lazy-bg 懒加载背景图指令
│   ├── router/             # 路由（含 /random 随机文章、404）
│   ├── styles/             # tokens.css（设计令牌）/ base.css / layout.css
│   ├── types/              # Post、NavItem 等类型定义
│   ├── utils/              # media（matchMedia 兜底）、search、format
│   └── views/              # HomeView、PostView、NotFoundView
├── vite.config.ts
└── vite.smoke.config.ts
```

## 相比原静态版的改进

- **内容与结构分离**：文章、导航、友链等硬编码 HTML 抽成类型安全的数据模块
- **修复原版重复 ID bug**：搜索/主题按钮在 PC 与移动端顶栏全量绑定（原版 PC 端失效）
- **matchMedia / IntersectionObserver 兜底**：不支持的环境直接降级，绝不中断脚本
- **路由化**：文章按 slug 路由、懒加载分包、404 页、随机文章
- **轮播增强**：移动端 / 悬停 / 页面后台时自动暂停
- **单一数据源**：主题、抽屉、搜索三态由根组件挂载，子组件共享

## 上线前待办

- [ ] `src/config/site.ts` 中域名、ICP 备案号仍为占位
- [ ] 评论区需在 giscus.app 配置仓库后启用（`CommentSection.vue`）
- [ ] 文章封面目前为 CSS 渐变占位，替换为真实图片 URL
- [ ] 多篇文章需在 `src/data/posts.ts` 中新增
