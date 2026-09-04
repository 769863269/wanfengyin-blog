# 晚风吟个人开发博客（Vue 3 版）

仿 Typecho/OneBlog 风格的个人开发博客，基于 **Vite + Vue 3 + TypeScript** 重构。

原静态 HTML 版完整保留在 [`legacy-static/`](./legacy-static/)，可随时对照或回退。

## 技术栈

| 类别     | 选型                                                |
| -------- | --------------------------------------------------- |
| 构建     | Vite 8（Rolldown）                                  |
| 框架     | Vue 3.5（`<script setup>` 组合式 API）              |
| 语言     | TypeScript 6，`strict` 全开                         |
| 路由     | vue-router 5（history 模式，懒加载）                |
| 代码规范 | ESLint 10（flat config）+ Prettier 3 + EditorConfig |

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器（自动先编译文章数据）
npm run build      # 文章编译 + 类型检查 + 生产构建 + SEO 预渲染（产物在 dist/）
npm run preview    # 预览生产构建
```

## 发文章

在 `articles/` 目录新建 `.md`（frontmatter + Markdown 正文）即可，
**不用碰任何代码**。字段说明与语法支持见 [articles/README.md](./articles/README.md)。

## 质量保障

```bash
npm test           # Vitest 单元测试（格式化/搜索/Markdown 转换）
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
├── articles/               # 🖊 文章源文件（Markdown + frontmatter）
├── public/                 # 静态资源（favicon、logo，原样输出）
├── scripts/
│   ├── lib/markdown.mjs    # Markdown → ArticleBlock 转换核心
│   ├── build-posts.mjs     # articles/*.md → posts.generated.ts
│   ├── prerender.mjs       # 构建后 SEO 预渲染 + 404.html
│   └── smoke.mjs           # jsdom 冒烟测试
├── tests/                  # Vitest 单元测试
├── legacy-static/          # 原静态版备份（仅存档，不参与构建）
├── src/
│   ├── components/         # article / common / home / layout 四层组件
│   ├── composables/        # useTheme、useSearch、useCarousel、usePostList…
│   ├── config/site.ts      # 站点信息集中配置（域名/导航/giscus）
│   ├── data/               # posts.ts（数据逻辑）+ posts.generated.ts（编译产物）
│   ├── directives/lazyBg.ts# v-lazy-bg 懒加载背景图指令
│   ├── router/             # 路由（含 /archives 归档、/random 随机、404）
│   ├── styles/             # tokens.css（设计令牌）/ base.css / layout.css
│   ├── types/              # Post、NavItem 等类型定义
│   ├── utils/              # media（matchMedia 兜底）、search、format、scrollLock
│   └── views/              # HomeView、PostView、ArchiveView、NotFoundView
├── .github/workflows/      # GitHub Pages 自动部署
├── DEPLOY.md               # 部署指南（Pages/Vercel/Nginx + 上线清单）
├── vite.config.ts          # 含 sitemap / RSS 构建插件
└── vite.smoke.config.ts
```

## 构建时自动生成（单一数据源，免维护）

| 产物                   | 数据来源      | 说明                                                  |
| ---------------------- | ------------- | ----------------------------------------------------- |
| sitemap.xml            | src/data      | 搜索引擎站点地图                                      |
| feed.xml               | articles/*.md | RSS 2.0 订阅                                          |
| dist/post/*/index.html | articles/*.md | 每篇文章的静态 HTML（百度等不执行 JS 的爬虫直接收录） |
| dist/404.html          | SPA 壳        | 静态托管 history 路由 fallback                        |

## 相比原静态版的改进

- **Markdown 发文**：文章源文件在 articles/，构建自动编译 + 校验
- **SEO 预渲染**：每篇文章构建时生成完整静态 HTML，搜索引擎可收录
- **RSS / 归档页**：导航对应入口已启用
- **内容与结构分离**：文章、导航、友链等硬编码 HTML 抽成类型安全的数据模块
- **修复原版重复 ID bug**：搜索/主题按钮在 PC 与移动端顶栏全量绑定（原版 PC 端失效）
- **matchMedia / IntersectionObserver 兜底**：不支持的环境直接降级，绝不中断脚本
- **路由化**：文章按 slug 路由、懒加载分包、404 页、随机文章
- **轮播增强**：移动端 / 悬停 / 页面后台时自动暂停

## 上线前待办

- [ ] `src/config/site.ts` 中域名、ICP 备案号仍为占位（影响 sitemap/RSS/canonical）
- [ ] 评论区需在 giscus.app 配置仓库后启用（`src/config/site.ts` 的 giscus 字段）
- [ ] 文章封面目前为 CSS 渐变占位，替换为真实图片 URL
- [ ] index.html 接入访问统计（占位注释已留好）
- [ ] 部署步骤与上线检查清单见 [DEPLOY.md](./DEPLOY.md)
