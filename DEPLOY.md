# 部署指南

构建产物在 `dist/`（已含每篇文章的预渲染 HTML、sitemap.xml、feed.xml、404.html）。

## 方案一：GitHub Pages（推荐，免费 + 自动化）

1. 在 GitHub 建仓库，推送本项目：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
3. 完成。`.github/workflows/deploy.yml` 已配置好：以后 push 到 main 自动构建部署。
4. 域名解析：Settings → Pages → Custom domain 填入域名，DNS 加 CNAME 记录。

> 首次部署后记得把 `src/config/site.ts` 的 `domain` 改成真实地址
> （如 `https://xxx.github.io/仓库名/`），否则 sitemap / RSS / canonical
> 里的链接都是占位域名。注意 GitHub Pages 子路径部署时还需把
> `vite.config.ts` 的 `base` 设为 `/仓库名/`。绑自有域名则无需改。

## 方案二：Vercel / Netlify

- 构建命令 `npm run build`，输出目录 `dist`，零配置。
- history 路由刷新：Vercel/Netlify 对 SPA 有自动 fallback（404.html 机制），
  预渲染产物也直接可用。

## 方案三：自己的服务器（Nginx）

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
}
```

## 访问统计

百度统计：在 https://tongji.baidu.com 创建站点，拿到代码后把
`index.html` 里标注 `<!-- 统计代码占位 -->` 的注释替换为统计脚本即可。

自托管可选 [umami](https://umami.is)（开源、无 Cookie），同样插一段
script 标签。

## 上线检查清单

- [ ] `src/config/site.ts`：`domain` 改真实域名
- [ ] `src/config/site.ts`：ICP 备案号
- [ ] index.html：接入统计代码
- [ ] `src/config/site.ts`：giscus 四个 ID 填入并把 `enabled` 改 `true`
- [ ] 提交后确认 sitemap（/sitemap.xml）与 RSS（/feed.xml）可访问
- [ ] 到百度搜索资源平台提交 sitemap
