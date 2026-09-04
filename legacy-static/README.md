# 晚风吟个人开发博客（风格克隆模板）

仿 [luohuayu.cn](https://www.luohuayu.cn/) 的 Typecho / OneBlog 风格静态博客模板。
纯 HTML + CSS + 原生 JS，**零依赖、零构建**，双击 `index.html` 即可预览。

## 文件结构

```
.
├── index.html      首页（8:2 布局 + 轮播 + 文章流 + 搜索）
├── post.html       文章详情页（正文 + 评论区占位）
├── style.css       全部样式（卡片 / 侧栏 / 响应式 / 夜间模式 / 搜索）
├── logo.svg        站点 logo（本地生成，矢量，主题红 #ff5050）
├── favicon.svg     标签页图标
├── sitemap.xml     SEO 站点地图（上线时把域名改成你的）
└── README.md       本文件
```

## 快速预览

直接用浏览器打开 `index.html`。

- 窗口缩到 **≤992px**：右侧栏自动隐藏，主内容占满。
- 窗口缩到 **≤768px**：PC 顶栏隐藏，启用移动端汉堡菜单（侧滑抽屉 + 遮罩）。
- 窗口缩到 **≤600px**：缩略图转纵向堆叠。

## 主要特性

- **8:2 响应式布局**：主内容 80% + 侧栏 20%，窄屏侧栏直接隐藏。
- **移动端汉堡菜单**：侧滑抽屉 + 遮罩，支持 ESC 关闭、点遮罩关闭、键盘可达。
- **夜间模式**：右上角 🌙 切换，记忆到 `localStorage`，首次访问跟随系统深色偏好。
- **站内搜索**：首页右上角 🔍 打开弹窗，实时过滤文章标题与内容。
- **图片懒加载**：缩略图/封面图用 `IntersectionObserver` 进视口才加载。
- **加载更多**：首页底部按钮分批展开隐藏文章。
- **评论区占位**：`post.html` 用「即将上线」占位；接 Giscus 即可启用（见下）。
- **SEO / 无障碍**：`meta description`、Open Graph、Twitter Card、`:focus-visible` 轮廓、ARIA 属性、sitemap。

## 怎么改成你自己的

### 1. 改主题色

打开 `style.css`，改 `:root` 里的 `--theme-color`（默认 `#ff5050` 红）。
夜间模式配色在 `html.night` 那一段，按需微调。

### 2. 加文章

- **首页列表**：复制 `index.html` 里任意一个 `<a class="post">…</a>` 块，改标题、摘要、`post_meta` 即可。
  想默认隐藏（靠「加载更多」展开）就加 `extra` 类：`<a class="post extra">`。
  无缩略图加 `nothumb` 类。
- **详情页**：目前只有 `post.html` 一个示例，多发文章需自行复制页面或接入生成器。

### 3. 启用评论区（Giscus，零后端）

1. 去 [giscus.app/zh-CN](https://giscus.app/zh-CN) 用你的 GitHub 仓库生成配置。
2. 打开 `post.html`，删掉 `.comments-placeholder` 那个 div。
3. 把下面被 `<!-- -->` 注释的 Giscus `<script>` 取消注释。
4. 把 `data-repo` / `data-repo-id` / `data-category-id` 换成你自己的值。

### 4. 换品牌

站名已统一为「晚风吟」，如需换成你自己的品牌：

- 替换 `logo.svg` 为你自己的 logo（或改 `favicon.svg`）；
- 把页面里的「晚风吟」文字全局替换成你的品牌名。

### 5. 上线

静态托管即可（GitHub Pages / Vercel / 任意空间）。
记得把 `sitemap.xml` 里的 `https://your-domain.com` 改成真实域名，并补全各页 OG 的 `og:image`。

## 已知占位（上线前需替换）

- `sitemap.xml` 域名占位 `your-domain.com`
- 各页 `og:image` 占位 `https://your-domain.com/cover.jpg`
- 导航/侧栏中 `#` 链接、热门文章、最新评论、标签云均为示例数据
- 轮播图为 CSS 渐变占位，可换真实图片
