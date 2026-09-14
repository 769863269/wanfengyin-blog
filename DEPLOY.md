# 部署指南

构建产物在 `dist/`（已含每篇文章的预渲染 HTML、sitemap.xml、feed.xml、404.html）。

> **当前线上用的是方案一（Vercel）**，其余方案保留备用。

## 方案一：Vercel（当前线上，推荐）

1. 在 Vercel 导入本仓库，框架预设选 **Vite**：构建命令 `npm run build`，输出目录 `dist`。
2. 绑定 `main` 分支 —— 之后每次 `git push` 自动构建发布（后台「同步到 GitHub」即走这条链路）。
3. 域名：项目 Settings → Domains 填入自有域名，按提示加 DNS 记录。

### ⚠️ 响应头只有一处生效：`vercel.json`

站点的 CSP / 防嗅探 / 缓存策略**必须写在仓库根目录的 `vercel.json` 里**。

> **实测结论（2026-09-14）**：`public/_headers` 在 Vercel 上**完全不生效**。
> 取证方式是比对实际返回值 —— `/assets/*` 拿到的是 Vercel 默认的
> `public, max-age=0, must-revalidate`，而不是 `_headers` 里写的 `max-age=31536000, immutable`。
> 该文件只对 **Netlify / Cloudflare Pages** 这类「发布目录含 `_headers`」的平台有效。

因此仓库里同时保留两份头部配置（多平台需要），**改一处必须改两处**，
改完跑一次一致性校验：

```bash
npm run check:headers   # 逐条比对 vercel.json 与 public/_headers，不一致即退出码 1
```

Vercel 的多规则语义：**同一响应头以后定义的规则为准**（每个响应只输出 1 条该头），
所以 `/page-html/(.*)` 能干净覆盖 `/(.*)`，不存在「两条 CSP 取交集」的问题。

### 关于 `/page-html/`（完整 HTML 独立页）

后台勾了「完整 HTML 独立页」的自定义页面，构建期会把整份 HTML 落到
`public/page-html/<slug>.html`，由前台用 `sandbox="allow-scripts"` 的 iframe 以 `src` 加载。

这些页面需要跑自己的内联 `<script>`，因此在 `vercel.json` 里单独给了宽松策略，
并用 CSP 的 `sandbox` 指令把它们关进 **opaque origin** ——
即使有人直接打开该 URL，脚本也拿不到本站 cookie / localStorage，等同匿名沙箱。
（**不要**改回 iframe `srcdoc`：子文档继承父页 CSP，而多条 CSP 只能取交集、无法放宽，
父页的 `script-src 'self'` 会把内联脚本拦掉。）

## 方案二：Netlify / Cloudflare Pages

- 构建命令 `npm run build`，输出目录 `dist`，零配置。
- 这两家直接读 `public/_headers`，无需 `vercel.json`；两份配置保持一致即可。
- history 路由刷新：两家对 SPA 都有自动 fallback，预渲染产物也直接可用。

## 方案三：GitHub Pages（备用）

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**（需自行补一个 workflow，
   仓库当前**不含** `.github/workflows/`）。
2. 自定义域名：Settings → Pages → Custom domain，DNS 加 CNAME 记录。

> 子路径部署（`https://<用户名>.github.io/<仓库名>/`）时：
> - `vite.config.ts` 的 `base` 要设为 `/仓库名/`
> - `src/config/site.ts` 的 `domain` 要改成含子路径的完整地址
> - `vercel.json` 里的 `/assets/(.*)`、`/page-html/(.*)` 规则在 Pages 上不生效，
>   需要迁到 `public/_headers` 或改用 Nginx

## 方案四：自己的服务器（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/wanfengyin/dist;
    index index.html;

    # history 路由刷新 404 的解法
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存（文件名带 hash）
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 完整 HTML 独立页：放行内联脚本，但关进 opaque origin
    location /page-html/ {
        add_header Content-Security-Policy "sandbox allow-scripts; default-src 'self' data: blob: https:; script-src 'unsafe-inline' 'self' https:; style-src 'unsafe-inline' 'self' https:; img-src 'self' data: blob: https:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
    }
}
```

## 访问统计

百度统计：在 https://tongji.baidu.com 创建站点，拿到代码后把
`index.html` 里标注 `<!-- 统计代码占位 -->` 的注释替换为统计脚本即可。

自托管可选 [umami](https://umami.is)（开源、无 Cookie），同样插一段 script 标签。
> 注意：接入外站脚本后要同步放宽 `vercel.json` 与 `public/_headers` 的 `script-src` /
> `connect-src`，否则会被 CSP 拦掉（用 `npm run check:headers` 确认两份同步）。

## 上线检查清单

- [x] `src/config/site.ts`：`domain` 已配置真实域名
- [x] 文章封面已替换为真实图片（`public/images/covers/`）
- [ ] `content/site.json`：ICP 备案号（绑定自有域名后填）
- [ ] `src/config/site.ts`：giscus 四个 ID 填入并把 `enabled` 改 `true`
- [ ] index.html：接入统计代码
- [ ] `npm run check:headers` 通过（头部两份配置一致）
- [ ] 提交后确认 sitemap（/sitemap.xml）与 RSS（/feed.xml）可访问
- [ ] 到百度搜索资源平台提交 sitemap
