# 晚风吟个人开发博客（Vue 3 版）

仿 Typecho/OneBlog 风格的个人开发博客，基于 **Vite + Vue 3 + TypeScript** 重构。

线上地址：<https://wanfengyin-blog.vercel.app>（推 `main` 自动构建）。
配套有一套**自研 CMS 后台**（`scripts/studio/`，只监听本机 `127.0.0.1:5199`）负责文章 / 页面 / 导航 / 站点的日常维护。

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
npm run dev        # 开发服务器 :5173（自动先编译文章数据）
npm run studio     # CMS 后台 :5199（本机专用，见下）
npm run build      # 文章编译 + 类型检查 + 生产构建 + SEO 预渲染（产物在 dist/）
npm run preview    # 预览生产构建
```

### CMS 后台（本机）

后台**刻意只监听 `127.0.0.1`**，也没有登录体系 —— 它要直接读写本机文章文件、
调用本机 `git` 推送，本质上是「本机工具」而不是「云服务」。公网无入口即零攻击面，
**不要用内网穿透把它暴露出去**。

```bash
node scripts/studio.mjs   # 重启后台请用这条，而不是 npm run studio
npm run test:studio       # 后台数据层契约测试
npm run test:studio:ui    # 后台界面冒烟（改 page.mjs 后先跑这个，白屏防线）
```

> 改完 `scripts/studio/page.mjs`：先跑 `npm run test:studio:ui`，再重启 `node scripts/studio.mjs`。
> 若动了 class 名，还需 `npm run studio:css` 重编样式快照。

## 发文章

在 `articles/` 目录新建 `.md`（frontmatter + Markdown 正文）即可，
**不用碰任何代码**。字段说明与语法支持见 [articles/README.md](./articles/README.md)。

## 质量保障

```bash
npm test             # Vitest 单元测试（格式化/搜索/Markdown 转换/导航/块解析）
npm run lint         # ESLint 检查
npm run lint:fix     # 自动修复
npm run format       # Prettier 统一格式
npm run type-check   # vue-tsc 类型检查
npm run check:headers# 校验 vercel.json 与 public/_headers 的响应头一致
npm run smoke        # jsdom 冒烟测试（挂载/主题/搜索/路由/加载更多）
```

冒烟测试说明：jsdom 不执行 `<script type="module">`，故 `npm run smoke`
先用 `vite.config.smoke.ts` 打一个 IIFE 单文件测试包到 `dist-smoke/`（已 gitignore），
再由 `scripts/smoke.mjs` 在 jsdom 中挂载完整应用并逐项断言核心交互。

## 命名规范

| 类别                | 规则                                  | 示例                                     |
| ------------------- | ------------------------------------- | ---------------------------------------- |
| Vue 组件            | PascalCase + 多词（防与原生标签冲突） | `PostCard.vue`、`AppHeader.vue`          |
| 组合式函数          | `use` 前缀 + camelCase                | `useTheme.ts`                            |
| 指令文件            | 驼峰，与指令名（kebab-case）对应      | `lazyBg.ts` → `v-lazy-bg`                |
| utils / 数据 / 配置 | camelCase，名称体现职责               | `mediaQuery.ts`、`scrollLock.ts`         |
| 构建脚本            | kebab-case + `.mjs`                   | `build-posts.mjs`、`prerender.mjs`       |
| Vite 配置           | `vite.config.<用途>.ts`，主配置无后缀 | `vite.config.ts`、`vite.config.smoke.ts` |
| 测试文件            | `<被测模块>.test.ts`，集中在 `tests/` | `format.test.ts`                         |
| 类型声明            | Vite 惯例位置与名称                   | `src/vite-env.d.ts`                      |
| 样式                | 全小写，按层级命名                    | `tokens.css`、`base.css`、`layout.css`   |
| 文章                | `YYYY-MM-DD-<slug>.md`，slug 即 URL   | `2026-09-02-rest-day.md`                 |
| 生成产物            | `<源文件名>.generated.ts`，禁止手改   | `posts.generated.ts`                     |
| 静态资源            | kebab-case，放 `public/`              | `logo.svg`、`robots.txt`                 |
| 根目录文档          | README.md（总览）+ 全大写主题文档     | `DEPLOY.md`                              |

## 目录结构

```
├── articles/               # 🖊 文章源文件（Markdown + frontmatter）
├── content/
│   ├── site.json           # 站点文案 / 导航菜单（后台「站点设置」维护，入库）
│   └── pages/*.md          # 自定义页面源文件（文件名即 slug）
├── public/                 # 静态资源（favicon、logo、封面，原样输出）
│   ├── _headers            # 响应头（Netlify / CF Pages 用；Vercel 请改 vercel.json）
│   └── page-html/          # 「完整 HTML 独立页」构建产物（gitignore，prebuild 重建）
├── scripts/
│   ├── lib/                # 共享层：markdown / articles / nav / slug / highlight / frontmatter
│   ├── build-posts.mjs     # articles/*.md → posts.generated.ts + posts.body.generated.ts
│   ├── build-pages.mjs     # content/pages/*.md → pages.generated.ts（含 public/page-html/）
│   ├── prerender.mjs       # 构建后 SEO 预渲染 + 404.html
│   ├── publish.mjs         # 后台「同步到 GitHub」：白名单暂存 + 密钥扫描 + 提交推送
│   ├── check-headers.mjs   # 校验 vercel.json 与 public/_headers 头部一致
│   ├── smoke.mjs           # jsdom 冒烟测试
│   └── studio/             # CMS 后台（零构建 ESM：page / server / store / gitconfig）
├── tests/                  # Vitest 单元测试
├── src/
│   ├── components/         # article / common / home / layout 四层组件
│   ├── composables/        # useTheme、useSearch、useCarousel、usePostList…
│   ├── config/site.ts      # 站点信息集中配置（域名/导航/giscus）
│   ├── data/               # posts.ts（数据逻辑）+ *.generated.ts（编译产物，禁止手改）
│   ├── directives/lazyBg.ts# v-lazy-bg 懒加载背景图指令
│   ├── router/             # 路由（归档 / 随机 / 自定义页 / 404）
│   ├── styles/             # tokens.css（设计令牌）/ base.css / layout.css
│   ├── types/              # Post、NavItem、ArticleBlock 等类型定义
│   ├── utils/              # article、search、sanitize、format、mediaQuery、scrollLock…
│   └── views/              # HomeView、PostView、PageView、ArchiveView、TagsView…
├── vercel.json             # ⭐ 线上响应头唯一生效来源（CSP / 缓存 / X-Frame-Options）
├── tailwind.config.cjs     # 后台样式预编译配置（npm run studio:css）
├── DEPLOY.md               # 部署指南（Vercel / Nginx + 上线清单）
├── vite.config.ts          # 含 sitemap / RSS 构建插件
└── vite.config.smoke.ts
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

## 自定义页面与导航

在 `content/pages/` 新建 `<slug>.md`（后台「自定义页面」页可视化管理），前台即多出 `/page/<slug>`。

可达性是**构建期决定**的，规则只有一份实现（`scripts/lib/slug.mjs` + `scripts/lib/nav.mjs`，前后台共用）：

> 前台可访问 ⟺ `status: published` **且**（已在导航菜单中被引用 **或** `directAccess: true`）

- 两者都不满足 = 「发布了但没上线」→ **不注册路由**，直接 404
- 导航菜单（`content/site.json` 的 `mainNav`）同时驱动 web 顶栏与手机抽屉，支持多级子菜单
- 需要整页 HTML + 内联 script（打字机、Canvas 交互等）时，在 frontmatter 加 `fullHtml: true`：
  正文会原样落到 `public/page-html/<slug>.html`，由 `PageView` 用 `sandbox="allow-scripts"` 的 iframe 隔离渲染
  （不能走 `srcdoc`：子文档会继承父页 CSP，而多条 CSP 只能取交集、无法放宽）

## 部署

线上为 Vercel（推 `main` 自动构建），仓储根 `vercel.json` 提供 CSP 等安全响应头。
⚠️ **Vercel 不读 `public/_headers`**，改头部规则请改 `vercel.json`，并用 `npm run check:headers` 校验两份配置一致。

## 上线前待办

- [x] 域名 —— 已配置 <https://wanfengyin-blog.vercel.app>
- [x] 文章封面 —— 已替换为 14 张真实封面（`public/images/covers/`）
- [ ] ICP 备案号 —— 绑定自有域名后补（`content/site.json`）
- [ ] 评论区 —— 在 giscus.app 配置仓库后启用（`src/config/site.ts` 的 giscus 字段）
- [ ] 导航里仍为 `disabled` 的占位项 —— 功能就绪后改为 `route` / `external`
- [ ] index.html 接入访问统计（占位注释已留好）
- [ ] 部署步骤与上线检查清单见 [DEPLOY.md](./DEPLOY.md)
