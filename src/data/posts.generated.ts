/**
 * ⚠️ 本文件由 scripts/build-posts.mjs 自动生成，请勿手工编辑。
 *
 * 数据源：articles/*.md
 * 重新生成：npm run posts（dev / build 前自动执行）
 */
import type { Post } from '@/types'

export const generatedPosts: Post[] = [
  {
    "slug": "vite8-rolldown-migration",
    "title": "vite8-rolldown-迁移实录",
    "excerpt": "Vite 8 换用 Rolldown 构建引擎，冷启动和构建速度的变化，以及 manualChunks 那个 breaking change。",
    "cover": "/images/covers/vite8-rolldown-migration.jpg",
    "publishedAt": "2026-08-30",
    "views": 1823,
    "commentCount": 23,
    "tags": [
      "Vite",
      "构建"
    ],
    "featured": true,
    "body": [
      {
        "type": "paragraph",
        "text": "Vite 8 底层换成了 Rolldown（Rust 写的打包器），性能提升是真实的：冷启动肉眼可见地快，生产构建时间近乎减半。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "迁移成本"
      },
      {
        "type": "paragraph",
        "text": "绝大多数项目零改动直迁，这个项目只踩到一个 breaking change：manualChunks 不再接受对象形式。"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// Vite 7 及以前：对象写法\nbuild: {\n  rollupOptions: {\n    output: {\n      manualChunks: {\n        vue: ['vue', 'vue-router'],\n      },\n    },\n  },\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// Vite 7 及以前：对象写法</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">build</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  rollupOptions</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    output</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">      manualChunks</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">        vue</span><span style=\"color:#E1E4E8\">: [</span><span style=\"color:#9ECBFF\">'vue'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#9ECBFF\">'vue-router'</span><span style=\"color:#E1E4E8\">],</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// Vite 8：必须函数返回\nbuild: {\n  rollupOptions: {\n    output: {\n      manualChunks(id) {\n        if (id.includes('node_modules')) return 'vue'\n        return undefined\n      },\n    },\n  },\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// Vite 8：必须函数返回</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">build</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  rollupOptions</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    output</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">      manualChunks</span><span style=\"color:#E1E4E8\">(id) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">        if</span><span style=\"color:#E1E4E8\"> (id.</span><span style=\"color:#B392F0\">includes</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'node_modules'</span><span style=\"color:#E1E4E8\">)) </span><span style=\"color:#F97583\">return</span><span style=\"color:#9ECBFF\"> 'vue'</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">        return</span><span style=\"color:#79B8FF\"> undefined</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "报错信息写得清楚，照着改就行。工具链升级的正确姿势：先看 changelog 的 breaking changes，再动手，五分钟的事别变成五小时的考古。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "速度对比"
      },
      {
        "type": "paragraph",
        "text": "同一个项目（20 篇文章 + 预渲染 + sitemap/RSS 生成）的粗测数据："
      },
      {
        "type": "code",
        "lang": "text",
        "text": "                     Vite 7      Vite 8 (Rolldown)\n冷启动 dev           ~1.8s       ~0.9s\n生产构建             ~11s        ~5.9s\n依赖预构建           明显等待     几乎无感",
        "codeHtml": "<span class=\"line\"><span>                     Vite 7      Vite 8 (Rolldown)</span></span>\n<span class=\"line\"><span>冷启动 dev           ~1.8s       ~0.9s</span></span>\n<span class=\"line\"><span>生产构建             ~11s        ~5.9s</span></span>\n<span class=\"line\"><span>依赖预构建           明显等待     几乎无感</span></span>"
      },
      {
        "type": "paragraph",
        "text": "热更新稳定在毫秒级，改代码到浏览器更新的延迟低到可以忽略。这种「无感」恰恰是工具链成熟的标志——好的工具是感觉不到的工具。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "插件生态"
      },
      {
        "type": "paragraph",
        "text": "Rolldown 兼容大部分 Rollup 插件 API，项目里自写的 sitemap、RSS、预渲染插件全部原样能跑。构建日志里多了一个 plugin-timings 输出，能直接看到每个插件钩子耗时的占比，排查构建慢有据可依。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "建议"
      },
      {
        "type": "paragraph",
        "text": "新项目直接上 Vite 8，没有理由用旧的。存量项目升级前把 Node 版本和 lockfile 锁好，跑一遍完整构建加测试再合并。这次迁移全程不到半小时，其中二十分钟在看 changelog——这比例是对的。"
      }
    ]
  },
  {
    "slug": "vue3.5-composition-api-notes",
    "title": "vue3.5-composition-api-心得",
    "excerpt": "用了一年组合式 API 的阶段性总结：状态放哪、逻辑怎么拆、什么情况下该抽 composable。",
    "cover": "/images/covers/vue3.5-composition-api-notes.jpg",
    "publishedAt": "2026-08-22",
    "views": 1547,
    "commentCount": 18,
    "tags": [
      "Vue",
      "TypeScript"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "组合式 API 最大的变化不是写法，是「逻辑的组织方式」：相关逻辑不再被 data/methods/computed 切成四段，而是住在一起。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "状态放哪"
      },
      {
        "type": "paragraph",
        "text": "判断标准只有一条：谁的生命周期该管它。全局状态在根组件挂载一次，子组件 useXxx 拿到同一实例："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// src/composables/usePostList.ts —— 模块级单例\nconst sharedCount = shallowRef<number | null>(null)\n\nexport function usePostList() {\n  // 没有实例才初始化，跨路由保留状态\n  sharedCount.value ??= ref(PAGE_SIZE)\n  return { visibleCount: sharedCount }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// src/composables/usePostList.ts —— 模块级单例</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> sharedCount</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> shallowRef</span><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#79B8FF\">number</span><span style=\"color:#F97583\"> |</span><span style=\"color:#79B8FF\"> null</span><span style=\"color:#E1E4E8\">>(</span><span style=\"color:#79B8FF\">null</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">export</span><span style=\"color:#F97583\"> function</span><span style=\"color:#B392F0\"> usePostList</span><span style=\"color:#E1E4E8\">() {</span></span>\n<span class=\"line\"><span style=\"color:#6A737D\">  // 没有实例才初始化，跨路由保留状态</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  sharedCount.value </span><span style=\"color:#F97583\">??=</span><span style=\"color:#B392F0\"> ref</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">PAGE_SIZE</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  return</span><span style=\"color:#E1E4E8\"> { visibleCount: sharedCount }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "这个模式救过一次命：列表页「加载更多」的进度，原来放在组件里，进详情返回就丢。状态提升成模块级单例后，跨路由天然保留。页面局部状态（表单、弹窗开关）就老老实实留在页面组件里，别滥用单例。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "什么时候抽 composable"
      },
      {
        "type": "quote",
        "text": "composable 抽取的时机是第二次重复，不是第一次出现。"
      },
      {
        "type": "paragraph",
        "text": "第一次写逻辑时直接内联，第二次遇到相同需求再抽。提前抽象的代价是接口猜错导致的返工，重复两次的代价只是复制粘贴，后者便宜得多。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "类型体验"
      },
      {
        "type": "paragraph",
        "text": "defineProps 泛型写法让 props 类型零冗余："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const { post } = defineProps<{ post: Post }>()\nconst relativeTime = computed(() => formatRelativeTime(post.publishedAt))",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#E1E4E8\"> { </span><span style=\"color:#79B8FF\">post</span><span style=\"color:#E1E4E8\"> } </span><span style=\"color:#F97583\">=</span><span style=\"color:#B392F0\"> defineProps</span><span style=\"color:#E1E4E8\">&#x3C;{ </span><span style=\"color:#FFAB70\">post</span><span style=\"color:#F97583\">:</span><span style=\"color:#B392F0\"> Post</span><span style=\"color:#E1E4E8\"> }>()</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> relativeTime</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> computed</span><span style=\"color:#E1E4E8\">(() </span><span style=\"color:#F97583\">=></span><span style=\"color:#B392F0\"> formatRelativeTime</span><span style=\"color:#E1E4E8\">(post.publishedAt))</span></span>"
      },
      {
        "type": "paragraph",
        "text": "computed 自动推导返回类型，ref 在模板里自动解包，TS 全程无断言。类型即文档，重构改 Post 接口时，所有受影响组件编译期全部标红，一个都漏不掉。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "一个提醒"
      },
      {
        "type": "paragraph",
        "text": "组合式 API 不等于「所有东西都抽成函数」。组件内三五行的一次性逻辑，封装只会增加跳转成本。组合式解决的是逻辑复用和组织，不是逼你写更多函数。"
      }
    ]
  },
  {
    "slug": "css-grid-82-layout",
    "title": "css-grid-八二布局",
    "excerpt": "主内容 8 份、侧栏 2 份的经典博客布局，用 Grid 三行搞定，附响应式收窄方案。",
    "cover": "/images/covers/css-grid-82-layout.jpg",
    "publishedAt": "2026-08-15",
    "views": 986,
    "commentCount": 9,
    "tags": [
      "CSS"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "博客的 8:2 双栏布局，float 时代要写一堆清除，flex 时代要算比例，Grid 时代三行。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "实现"
      },
      {
        "type": "code",
        "lang": "css",
        "text": ".layout {\n  display: grid;\n  grid-template-columns: 8fr 2fr;\n  gap: 32px;\n  max-width: 1200px;\n  margin: 0 auto;\n  align-items: start;\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#B392F0\">.layout</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  display</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">grid</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  grid-template-columns</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">8</span><span style=\"color:#F97583\">fr</span><span style=\"color:#79B8FF\"> 2</span><span style=\"color:#F97583\">fr</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  gap</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">32</span><span style=\"color:#F97583\">px</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  max-width</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">1200</span><span style=\"color:#F97583\">px</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  margin</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> auto</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  align-items</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">start</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "align-items: start 是细节重点：默认 stretch 会让侧栏被拉伸到和主列一样高，sticky 定位直接失效。设为 start 后两列各按内容收缩，侧栏吸顶才正常。"
      },
      {
        "type": "paragraph",
        "text": "侧栏吸顶也是三行："
      },
      {
        "type": "code",
        "lang": "css",
        "text": ".sidebar {\n  position: sticky;\n  top: 24px;\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#B392F0\">.sidebar</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  position</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">sticky</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  top</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">24</span><span style=\"color:#F97583\">px</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "quote",
        "text": "布局系统的进步，就是把 hack 变成语义。Grid 的 fr 单位描述的是「分配关系」而不是「计算结果」，浏览器自己会算。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "响应式收窄"
      },
      {
        "type": "paragraph",
        "text": "断点的原则是内容先妥协，布局后妥协："
      },
      {
        "type": "code",
        "lang": "css",
        "text": "/* 992px 以下：侧栏退场，主列占满 */\n@media (max-width: 992px) {\n  .layout {\n    grid-template-columns: 1fr;\n  }\n  .sidebar {\n    display: none;\n  }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">/* 992px 以下：侧栏退场，主列占满 */</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">@media</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#79B8FF\">max-width</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">992</span><span style=\"color:#F97583\">px</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  .layout</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">    grid-template-columns</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">1</span><span style=\"color:#F97583\">fr</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  .sidebar</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">    display</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">none</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "600px 以下再处理卡片内部：缩略图从右侧改为纵向堆叠，摘要放宽到四行。移动端的卡片反而更完整，因为没有并排空间压力。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "为什么不用 flex"
      },
      {
        "type": "paragraph",
        "text": "flex 也能做 8:2（flex: 8 和 flex: 2），但两栏独立对齐、sticky、以及后续可能加的第三栏，Grid 都更自然。单行内容排列用 flex，二维布局用 Grid，这个分工清楚之后选择困难症就消失了。"
      }
    ]
  },
  {
    "slug": "blog-rebuild-from-zero",
    "title": "博客重构-从零到一",
    "excerpt": "纯静态模板迁移到 Vite + Vue 3 + TS 的完整复盘：架构决策、迁移顺序、验证闭环。",
    "cover": "/images/covers/blog-rebuild-from-zero.jpg",
    "publishedAt": "2026-08-08",
    "views": 2310,
    "commentCount": 31,
    "tags": [
      "随笔",
      "Vue"
    ],
    "featured": true,
    "body": [
      {
        "type": "paragraph",
        "text": "重构不是推倒重来，是把散落的逻辑收拢到该在的位置。旧版是纯 HTML + CSS + JS 模板，能跑，但加功能全靠复制粘贴。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "架构决策"
      },
      {
        "type": "paragraph",
        "text": "内容与结构分离是第一原则。文章、导航、友链、站点配置全部抽成数据模块，组件只负责渲染："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// src/config/site.ts —— 站点配置与页面彻底解耦\nexport const siteConfig = {\n  name: '晚风吟',\n  url: 'https://example.com',\n  nav: [\n    { id: 'home', label: '首页', icon: '🏠', kind: 'route', to: 'home' },\n    { id: 'archive', label: '归档', icon: '🗂', kind: 'route', to: 'archive' },\n    { id: 'rss', label: 'RSS', icon: '📡', kind: 'external', href: '/feed.xml' },\n  ],\n} as const",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// src/config/site.ts —— 站点配置与页面彻底解耦</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">export</span><span style=\"color:#F97583\"> const</span><span style=\"color:#79B8FF\"> siteConfig</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  name: </span><span style=\"color:#9ECBFF\">'晚风吟'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  url: </span><span style=\"color:#9ECBFF\">'https://example.com'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  nav: [</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    { id: </span><span style=\"color:#9ECBFF\">'home'</span><span style=\"color:#E1E4E8\">, label: </span><span style=\"color:#9ECBFF\">'首页'</span><span style=\"color:#E1E4E8\">, icon: </span><span style=\"color:#9ECBFF\">'🏠'</span><span style=\"color:#E1E4E8\">, kind: </span><span style=\"color:#9ECBFF\">'route'</span><span style=\"color:#E1E4E8\">, to: </span><span style=\"color:#9ECBFF\">'home'</span><span style=\"color:#E1E4E8\"> },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    { id: </span><span style=\"color:#9ECBFF\">'archive'</span><span style=\"color:#E1E4E8\">, label: </span><span style=\"color:#9ECBFF\">'归档'</span><span style=\"color:#E1E4E8\">, icon: </span><span style=\"color:#9ECBFF\">'🗂'</span><span style=\"color:#E1E4E8\">, kind: </span><span style=\"color:#9ECBFF\">'route'</span><span style=\"color:#E1E4E8\">, to: </span><span style=\"color:#9ECBFF\">'archive'</span><span style=\"color:#E1E4E8\"> },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    { id: </span><span style=\"color:#9ECBFF\">'rss'</span><span style=\"color:#E1E4E8\">, label: </span><span style=\"color:#9ECBFF\">'RSS'</span><span style=\"color:#E1E4E8\">, icon: </span><span style=\"color:#9ECBFF\">'📡'</span><span style=\"color:#E1E4E8\">, kind: </span><span style=\"color:#9ECBFF\">'external'</span><span style=\"color:#E1E4E8\">, href: </span><span style=\"color:#9ECBFF\">'/feed.xml'</span><span style=\"color:#E1E4E8\"> },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  ],</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">} </span><span style=\"color:#F97583\">as</span><span style=\"color:#F97583\"> const</span></span>"
      },
      {
        "type": "paragraph",
        "text": "全局状态（主题、搜索、轮播）收进 composables，谁的状态谁管理："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// src/composables/useTheme.ts\nconst theme = ref<ThemeMode>('light')\n\nexport function useTheme() {\n  const toggle = () => {\n    theme.value = theme.value === 'light' ? 'dark' : 'light'\n    document.documentElement.classList.toggle('night', theme.value === 'dark')\n    localStorage.setItem('theme', theme.value)\n  }\n  return { theme, toggle }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// src/composables/useTheme.ts</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> theme</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> ref</span><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#B392F0\">ThemeMode</span><span style=\"color:#E1E4E8\">>(</span><span style=\"color:#9ECBFF\">'light'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">export</span><span style=\"color:#F97583\"> function</span><span style=\"color:#B392F0\"> useTheme</span><span style=\"color:#E1E4E8\">() {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#B392F0\"> toggle</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    theme.value </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> theme.value </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'light'</span><span style=\"color:#F97583\"> ?</span><span style=\"color:#9ECBFF\"> 'dark'</span><span style=\"color:#F97583\"> :</span><span style=\"color:#9ECBFF\"> 'light'</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    document.documentElement.classList.</span><span style=\"color:#B392F0\">toggle</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'night'</span><span style=\"color:#E1E4E8\">, theme.value </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'dark'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    localStorage.</span><span style=\"color:#B392F0\">setItem</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'theme'</span><span style=\"color:#E1E4E8\">, theme.value)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  return</span><span style=\"color:#E1E4E8\"> { theme, toggle }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "quote",
        "text": "好架构的标志：加一篇文章、加一个页面，都不需要「碰」框架代码。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "迁移顺序"
      },
      {
        "type": "paragraph",
        "text": "先搭骨架（构建器、路由、类型定义），再搬页面（从静态 HTML 逐页转 SFC），最后搬数据（文章进 Markdown 流水线）。旧版整个留作对照，迁移期间随时比对视觉和行为差异。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "验证闭环"
      },
      {
        "type": "paragraph",
        "text": "lint、类型检查、单测、构建、jsdom 冒烟五道关卡全绿才算完。冒烟测试在重构里最值：旧版的交互行为全部固化成断言，新实现只要全过，行为就没丢。"
      },
      {
        "type": "quote",
        "text": "重构最大的风险不是写错，是「以为没写错」。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "复盘"
      },
      {
        "type": "paragraph",
        "text": "这次重构最值钱的决定是先建数据层再做组件。数据结构定了，组件的 props 和 composables 的接口自然清晰，返工率为零。反过来先写组件后定数据的话，至少返工一轮。"
      }
    ]
  },
  {
    "slug": "typescript-strict-survival",
    "title": "typescript-strict-生存指南",
    "excerpt": "strict 全开 + noUncheckedIndexedAccess，编译器替你抓住的每一个坑都值得。",
    "cover": "/images/covers/typescript-strict-survival.jpg",
    "publishedAt": "2026-07-30",
    "views": 1754,
    "commentCount": 16,
    "tags": [
      "TypeScript"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "TS 开 strict 是痛一时爽一时的投资：开着难受，关了后悔。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "为什么全开"
      },
      {
        "type": "paragraph",
        "text": "strict 模式会在编译期抓住大量「运行时才炸」的问题：可能为 undefined 的索引访问、漏判的分支、隐式 any。项目的 tsconfig 就两行核心："
      },
      {
        "type": "code",
        "lang": "json",
        "text": "{\n  \"compilerOptions\": {\n    \"strict\": true,\n    \"noUncheckedIndexedAccess\": true\n  }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">{</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  \"compilerOptions\"</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">    \"strict\"</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">true</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">    \"noUncheckedIndexedAccess\"</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">true</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "quote",
        "text": "类型系统的收益和严格程度成正比。半开等于没开。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "noUncheckedIndexedAccess：最狠也最值"
      },
      {
        "type": "paragraph",
        "text": "开了它，所有数组索引访问的返回类型都带一个 undefined 可能性："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const posts: Post[] = getAllPosts()\nconst first = posts[0]\n// 类型是 Post | undefined，不判空不让用\n\nif (first) {\n  console.log(first.title) // 这里才安全\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> posts</span><span style=\"color:#F97583\">:</span><span style=\"color:#B392F0\"> Post</span><span style=\"color:#E1E4E8\">[] </span><span style=\"color:#F97583\">=</span><span style=\"color:#B392F0\"> getAllPosts</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> first</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> posts[</span><span style=\"color:#79B8FF\">0</span><span style=\"color:#E1E4E8\">]</span></span>\n<span class=\"line\"><span style=\"color:#6A737D\">// 类型是 Post | undefined，不判空不让用</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">if</span><span style=\"color:#E1E4E8\"> (first) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  console.</span><span style=\"color:#B392F0\">log</span><span style=\"color:#E1E4E8\">(first.title) </span><span style=\"color:#6A737D\">// 这里才安全</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "刚开的时候满屏报错很崩溃，但每一个报错都对应一个真实的「数组越界」潜在事故。查 findById 这类函数时尤其值——查找失败返回 undefined 而不是抛错的约定，配上这个开关，整个数据层的健壮性上了一个台阶。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "实战三件套"
      },
      {
        "type": "paragraph",
        "text": "第一是收窄。unknown 比 any 诚实，配合类型守卫逐步收窄："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "function isPost(value: unknown): value is Post {\n  return (\n    typeof value === 'object' &&\n    value !== null &&\n    typeof (value as Post).slug === 'string'\n  )\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">function</span><span style=\"color:#B392F0\"> isPost</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">value</span><span style=\"color:#F97583\">:</span><span style=\"color:#79B8FF\"> unknown</span><span style=\"color:#E1E4E8\">)</span><span style=\"color:#F97583\">:</span><span style=\"color:#FFAB70\"> value</span><span style=\"color:#F97583\"> is</span><span style=\"color:#B392F0\"> Post</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  return</span><span style=\"color:#E1E4E8\"> (</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    typeof</span><span style=\"color:#E1E4E8\"> value </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'object'</span><span style=\"color:#F97583\"> &#x26;&#x26;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    value </span><span style=\"color:#F97583\">!==</span><span style=\"color:#79B8FF\"> null</span><span style=\"color:#F97583\"> &#x26;&#x26;</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    typeof</span><span style=\"color:#E1E4E8\"> (value </span><span style=\"color:#F97583\">as</span><span style=\"color:#B392F0\"> Post</span><span style=\"color:#E1E4E8\">).slug </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'string'</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  )</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "第二是别骗编译器。as 断言每用一个都要问自己：这是「我比编译器多知道信息」还是「我不想处理类型错误」？后者迟早炸。"
      },
      {
        "type": "paragraph",
        "text": "第三是让 undefined 参与设计。可选字段用 ? 声明，查找函数返回值带 undefined，调用方自然会被编译器逼着处理空态。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "迁移建议"
      },
      {
        "type": "paragraph",
        "text": "存量项目别一口气全开。先开 strict 基础项修干净，再开 noUncheckedIndexedAccess 单独修一轮。报错最多的一天修了四十多处，其中至少五处是真 bug——编译器替你抓住的每一个坑都值得。"
      }
    ]
  },
  {
    "slug": "lazy-load-and-intersectionobserver",
    "title": "懒加载与-intersectionobserver",
    "excerpt": "从监听 scroll 到 IntersectionObserver，图片懒加载的演进史与兼容性兜底方案。",
    "cover": "/images/covers/lazy-load-and-intersectionobserver.jpg",
    "publishedAt": "2026-07-24",
    "views": 879,
    "commentCount": 7,
    "tags": [
      "性能优化"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "懒加载的原理一句话：视口外的图不加载。难点全在「怎么知道进入了视口」。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "史前方案：监听 scroll"
      },
      {
        "type": "paragraph",
        "text": "老方案在 scroll 事件里手动算几何：元素顶边和视口底边的距离小于阈值就加载。能跑，但有两个硬伤："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "// 每个 scroll 帧都在做几何计算，节流写不好就是性能灾难\nwindow.addEventListener('scroll', () => {\n  document.querySelectorAll('img[data-src]').forEach((img) => {\n    const rect = img.getBoundingClientRect()\n    if (rect.top < window.innerHeight + 200) {\n      img.src = img.dataset.src\n    }\n  })\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// 每个 scroll 帧都在做几何计算，节流写不好就是性能灾难</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">window.</span><span style=\"color:#B392F0\">addEventListener</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'scroll'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  document.</span><span style=\"color:#B392F0\">querySelectorAll</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'img[data-src]'</span><span style=\"color:#E1E4E8\">).</span><span style=\"color:#B392F0\">forEach</span><span style=\"color:#E1E4E8\">((</span><span style=\"color:#FFAB70\">img</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    const</span><span style=\"color:#79B8FF\"> rect</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> img.</span><span style=\"color:#B392F0\">getBoundingClientRect</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    if</span><span style=\"color:#E1E4E8\"> (rect.top </span><span style=\"color:#F97583\">&#x3C;</span><span style=\"color:#E1E4E8\"> window.innerHeight </span><span style=\"color:#F97583\">+</span><span style=\"color:#79B8FF\"> 200</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      img.src </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> img.dataset.src</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  })</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "paragraph",
        "text": "主线程本来就忙，滚动时还要替每个候选图片算位置，低端机直接掉帧。加载完的图不摘除监听的话，越滚越卡。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "现代方案：IntersectionObserver"
      },
      {
        "type": "paragraph",
        "text": "观察器把「判断进入视口」交给浏览器，浏览器在合成阶段就知道答案，主线程零开销："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "const observer = new IntersectionObserver(\n  (entries, obs) => {\n    for (const entry of entries) {\n      if (!entry.isIntersecting) continue\n      entry.target.src = entry.target.dataset.src\n      obs.unobserve(entry.target) // 加载后立刻摘除，不占名额\n    }\n  },\n  { rootMargin: '200px 0px' }, // 提前 200px 预载\n)\n\ndocument.querySelectorAll('img[data-src]').forEach((img) => observer.observe(img))",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> observer</span><span style=\"color:#F97583\"> =</span><span style=\"color:#F97583\"> new</span><span style=\"color:#B392F0\"> IntersectionObserver</span><span style=\"color:#E1E4E8\">(</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  (</span><span style=\"color:#FFAB70\">entries</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">obs</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    for</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> entry</span><span style=\"color:#F97583\"> of</span><span style=\"color:#E1E4E8\"> entries) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">      if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#E1E4E8\">entry.isIntersecting) </span><span style=\"color:#F97583\">continue</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      entry.target.src </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> entry.target.dataset.src</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      obs.</span><span style=\"color:#B392F0\">unobserve</span><span style=\"color:#E1E4E8\">(entry.target) </span><span style=\"color:#6A737D\">// 加载后立刻摘除，不占名额</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  { rootMargin: </span><span style=\"color:#9ECBFF\">'200px 0px'</span><span style=\"color:#E1E4E8\"> }, </span><span style=\"color:#6A737D\">// 提前 200px 预载</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">document.</span><span style=\"color:#B392F0\">querySelectorAll</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'img[data-src]'</span><span style=\"color:#E1E4E8\">).</span><span style=\"color:#B392F0\">forEach</span><span style=\"color:#E1E4E8\">((</span><span style=\"color:#FFAB70\">img</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> observer.</span><span style=\"color:#B392F0\">observe</span><span style=\"color:#E1E4E8\">(img))</span></span>"
      },
      {
        "type": "paragraph",
        "text": "代码量还更少。唯一的「成本」是理解回调是异步批量触发的，别在回调里做重活。"
      },
      {
        "type": "quote",
        "text": "让浏览器做浏览器擅长的事。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "原生 loading 属性"
      },
      {
        "type": "paragraph",
        "text": "img 标签现在有原生方案："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<img src=\"cover.jpg\" loading=\"lazy\" decoding=\"async\" alt=\"封面\" />",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">img</span><span style=\"color:#B392F0\"> src</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"cover.jpg\"</span><span style=\"color:#B392F0\"> loading</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"lazy\"</span><span style=\"color:#B392F0\"> decoding</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"async\"</span><span style=\"color:#B392F0\"> alt</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"封面\"</span><span style=\"color:#E1E4E8\"> /></span></span>"
      },
      {
        "type": "paragraph",
        "text": "一行搞定，应该作为默认选择。但它只管 img 标签，背景图无能为力——背景图的懒加载还是得靠观察器，这就是本项目封装 v-lazy-bg 指令的原因。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "兜底"
      },
      {
        "type": "paragraph",
        "text": "不支持观察器的环境直接降级为立即加载："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "if (typeof IntersectionObserver === 'undefined') {\n  loadAllImmediately()\n} else {\n  observeAll()\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">typeof</span><span style=\"color:#E1E4E8\"> IntersectionObserver </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'undefined'</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  loadAllImmediately</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">} </span><span style=\"color:#F97583\">else</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  observeAll</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "兼容性兜底的原则：宁可多加载，不能白屏。懒加载是优化，不是功能，优化不该有致死的可能。"
      }
    ]
  },
  {
    "slug": "static-blog-seo-prerender",
    "title": "静态博客-seo-预渲染",
    "excerpt": "百度不执行 JS，SPA 等于对搜索引擎隐身。构建时预渲染每篇文章，收录问题一次解决。",
    "cover": "/images/covers/static-blog-seo-prerender.jpg",
    "publishedAt": "2026-07-18",
    "views": 1315,
    "commentCount": 12,
    "tags": [
      "SEO",
      "部署"
    ],
    "featured": true,
    "body": [
      {
        "type": "paragraph",
        "text": "单页应用再漂亮，搜索引擎爬虫看到的只有一个空 div。对靠内容吃饭的个人博客来说这是致命伤。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "问题本质"
      },
      {
        "type": "paragraph",
        "text": "SPA 的 HTML 壳里没有内容，正文全靠 JS 运行时渲染。Google 能执行 JS，百度基本不执行。所以同一个站，Google 收录正常，百度眼里你是个空站。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "预渲染方案"
      },
      {
        "type": "paragraph",
        "text": "文章本来就是构建时的静态数据，最适合构建时生成完整 HTML。postbuild 脚本为每篇文章输出一份独立 HTML：标题、描述、og 标签、正文全文都在："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "// scripts/prerender.mjs 核心逻辑\nfor (const post of posts) {\n  const html = shell\n    .replace('<!-- TITLE -->', escapeHtml(post.title))\n    .replace('<!-- META -->', buildMetaTags(post))\n    .replace('<!-- PRERENDERED -->', blocksToHtml(post.body))\n\n  const dir = join(distDir, 'post', post.slug)\n  mkdirSync(dir, { recursive: true })\n  writeFileSync(join(dir, 'index.html'), html)\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// scripts/prerender.mjs 核心逻辑</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">for</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> post</span><span style=\"color:#F97583\"> of</span><span style=\"color:#E1E4E8\"> posts) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> html</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> shell</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    .</span><span style=\"color:#B392F0\">replace</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'&#x3C;!-- TITLE -->'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#B392F0\">escapeHtml</span><span style=\"color:#E1E4E8\">(post.title))</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    .</span><span style=\"color:#B392F0\">replace</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'&#x3C;!-- META -->'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#B392F0\">buildMetaTags</span><span style=\"color:#E1E4E8\">(post))</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    .</span><span style=\"color:#B392F0\">replace</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'&#x3C;!-- PRERENDERED -->'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#B392F0\">blocksToHtml</span><span style=\"color:#E1E4E8\">(post.body))</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> dir</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> join</span><span style=\"color:#E1E4E8\">(distDir, </span><span style=\"color:#9ECBFF\">'post'</span><span style=\"color:#E1E4E8\">, post.slug)</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  mkdirSync</span><span style=\"color:#E1E4E8\">(dir, { recursive: </span><span style=\"color:#79B8FF\">true</span><span style=\"color:#E1E4E8\"> })</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  writeFileSync</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#B392F0\">join</span><span style=\"color:#E1E4E8\">(dir, </span><span style=\"color:#9ECBFF\">'index.html'</span><span style=\"color:#E1E4E8\">), html)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "关键点：正文也预渲染进去，而不是只渲染壳。爬虫拿到的和用户看到的，是同一份内容。"
      },
      {
        "type": "quote",
        "text": "预渲染的本质：给爬虫看的和给人看的，是同一份内容的不同时刻快照。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "接管无感知"
      },
      {
        "type": "paragraph",
        "text": "浏览器打开预渲染页，静态正文先显示，随后 Vue 应用挂载接管，用户全程无感知。因为类名结构对齐了同一套渲染约定，接管瞬间不会闪一下。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "配套"
      },
      {
        "type": "paragraph",
        "text": "sitemap 和 robots.txt 同样构建时生成，从文章数据派生，永不手工同步："
      },
      {
        "type": "code",
        "lang": "xml",
        "text": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url>\n    <loc>https://example.com/post/vite8-rolldown-migration/</loc>\n    <lastmod>2026-08-30</lastmod>\n  </url>\n</urlset>",
        "codeHtml": "<span class=\"line\"><span>&#x3C;?xml version=\"1.0\" encoding=\"UTF-8\"?></span></span>\n<span class=\"line\"><span>&#x3C;urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></span></span>\n<span class=\"line\"><span>  &#x3C;url></span></span>\n<span class=\"line\"><span>    &#x3C;loc>https://example.com/post/vite8-rolldown-migration/&#x3C;/loc></span></span>\n<span class=\"line\"><span>    &#x3C;lastmod>2026-08-30&#x3C;/lastmod></span></span>\n<span class=\"line\"><span>  &#x3C;/url></span></span>\n<span class=\"line\"><span>&#x3C;/urlset></span></span>"
      },
      {
        "type": "paragraph",
        "text": "每篇文章的 canonical 和 og 标签一并对齐，分享到社交平台也有像样的卡片。整套下来收录问题一次解决，之后每篇新文章自动享受全套待遇。"
      }
    ]
  },
  {
    "slug": "is-rss-dead",
    "title": "RSS-过时了吗",
    "excerpt": "大众不用 RSS，但你的核心读者在用。独立博客最后的「关注」通道，值得认真做。",
    "cover": "",
    "publishedAt": "2026-07-11",
    "views": 742,
    "commentCount": 14,
    "tags": [
      "随笔"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "常有人说 RSS 死了。大众用户确实不用，但这话对独立博客不成立。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "为什么做"
      },
      {
        "type": "paragraph",
        "text": "博客没有推送算法，读者看完走了大概率不再回来。RSS 是唯一让读者「订阅」你的机制：订阅器帮他盯着更新，有新文章自动送到面前。订阅者属于你的域名，不经过任何平台。"
      },
      {
        "type": "quote",
        "text": "平台的粉丝是租的，RSS 订阅者是自己的。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "做法零成本"
      },
      {
        "type": "paragraph",
        "text": "feed.xml 在构建时从文章数据自动生成，标准 RSS 2.0 格式加 atom:link 声明："
      },
      {
        "type": "code",
        "lang": "xml",
        "text": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n  <channel>\n    <title>晚风吟</title>\n    <link>https://example.com/</link>\n    <description>个人开发博客</description>\n    <atom:link href=\"https://example.com/feed.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n    <item>\n      <title>vite8-rolldown-迁移实录</title>\n      <link>https://example.com/post/vite8-rolldown-migration/</link>\n      <pubDate>Sun, 30 Aug 2026 00:00:00 GMT</pubDate>\n      <description>Vite 8 换用 Rolldown 构建引擎的迁移记录。</description>\n    </item>\n  </channel>\n</rss>",
        "codeHtml": "<span class=\"line\"><span>&#x3C;?xml version=\"1.0\" encoding=\"UTF-8\"?></span></span>\n<span class=\"line\"><span>&#x3C;rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\"></span></span>\n<span class=\"line\"><span>  &#x3C;channel></span></span>\n<span class=\"line\"><span>    &#x3C;title>晚风吟&#x3C;/title></span></span>\n<span class=\"line\"><span>    &#x3C;link>https://example.com/&#x3C;/link></span></span>\n<span class=\"line\"><span>    &#x3C;description>个人开发博客&#x3C;/description></span></span>\n<span class=\"line\"><span>    &#x3C;atom:link href=\"https://example.com/feed.xml\" rel=\"self\" type=\"application/rss+xml\"/></span></span>\n<span class=\"line\"><span>    &#x3C;item></span></span>\n<span class=\"line\"><span>      &#x3C;title>vite8-rolldown-迁移实录&#x3C;/title></span></span>\n<span class=\"line\"><span>      &#x3C;link>https://example.com/post/vite8-rolldown-migration/&#x3C;/link></span></span>\n<span class=\"line\"><span>      &#x3C;pubDate>Sun, 30 Aug 2026 00:00:00 GMT&#x3C;/pubDate></span></span>\n<span class=\"line\"><span>      &#x3C;description>Vite 8 换用 Rolldown 构建引擎的迁移记录。&#x3C;/description></span></span>\n<span class=\"line\"><span>    &#x3C;/item></span></span>\n<span class=\"line\"><span>  &#x3C;/channel></span></span>\n<span class=\"line\"><span>&#x3C;/rss></span></span>"
      },
      {
        "type": "paragraph",
        "text": "新文章自动进流，零维护成本，被动收益。XML 里的特殊字符记得转义，正文摘要里的 & 和 < 不处理会直接打挂整个 feed。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "页面上留入口"
      },
      {
        "type": "paragraph",
        "text": "head 里声明 feed 地址，阅读器能自动发现："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<link rel=\"alternate\" type=\"application/rss+xml\" title=\"晚风吟\" href=\"/feed.xml\" />",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">link</span><span style=\"color:#B392F0\"> rel</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"alternate\"</span><span style=\"color:#B392F0\"> type</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"application/rss+xml\"</span><span style=\"color:#B392F0\"> title</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"晚风吟\"</span><span style=\"color:#B392F0\"> href</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"/feed.xml\"</span><span style=\"color:#E1E4E8\"> /></span></span>"
      },
      {
        "type": "paragraph",
        "text": "页脚再放一个可见入口。别高估读者的主动寻找能力，也别低估 RSS 用户的忠诚度——他们往往是把内容真当回事的那批人。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "结论"
      },
      {
        "type": "paragraph",
        "text": "RSS 不需要「复兴」，它只是从大众退成了小众。而小众里恰好住着独立博客的核心读者。一个下午的配置换一条永久的分发渠道，这买卖划算。"
      }
    ]
  },
  {
    "slug": "vitest-getting-started",
    "title": "vitest-单测入门",
    "excerpt": "纯函数是最好的单测对象。时间格式化、搜索、Markdown 转换器，33 个用例的思路拆解。",
    "cover": "/images/covers/vitest-getting-started.jpg",
    "publishedAt": "2026-07-02",
    "views": 934,
    "commentCount": 6,
    "tags": [
      "测试",
      "工具"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "单测不是仪式感，是给未来的自己留的回归保险。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "从哪测起"
      },
      {
        "type": "paragraph",
        "text": "纯函数性价比最高：输入输出明确，一行断言一个行为，不依赖 DOM 不依赖网络。博客里最先被测的是三个工具函数：时间格式化、计数格式化、站内搜索。"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "import { describe, expect, it } from 'vitest'\nimport { formatCount } from '@/utils/format'\n\ndescribe('formatCount', () => {\n  it('不足一千原样输出', () => {\n    expect(formatCount(892)).toBe('892')\n  })\n\n  it('千位缩写保留一位小数', () => {\n    expect(formatCount(1593)).toBe('1.6k')\n  })\n\n  it('整千不显示小数点', () => {\n    expect(formatCount(2000)).toBe('2k')\n  })\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">import</span><span style=\"color:#E1E4E8\"> { describe, expect, it } </span><span style=\"color:#F97583\">from</span><span style=\"color:#9ECBFF\"> 'vitest'</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">import</span><span style=\"color:#E1E4E8\"> { formatCount } </span><span style=\"color:#F97583\">from</span><span style=\"color:#9ECBFF\"> '@/utils/format'</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#B392F0\">describe</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'formatCount'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  it</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'不足一千原样输出'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    expect</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#B392F0\">formatCount</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">892</span><span style=\"color:#E1E4E8\">)).</span><span style=\"color:#B392F0\">toBe</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'892'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  })</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  it</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'千位缩写保留一位小数'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    expect</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#B392F0\">formatCount</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">1593</span><span style=\"color:#E1E4E8\">)).</span><span style=\"color:#B392F0\">toBe</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'1.6k'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  })</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  it</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'整千不显示小数点'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    expect</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#B392F0\">formatCount</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">2000</span><span style=\"color:#E1E4E8\">)).</span><span style=\"color:#B392F0\">toBe</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'2k'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  })</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "quote",
        "text": "先测逻辑，再测交互；先测纯函数，再测组件。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "转换器是重点保护对象"
      },
      {
        "type": "paragraph",
        "text": "Markdown 转换器是全文最复杂的纯函数，也是唯一会把字符串变成 HTML 的地方，必须重点测试。XSS 转义的用例就是在攻防里长出来的："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "it('代码块里的 HTML 标签必须被转义', () => {\n  const blocks = markdownToBlocks('```html\\n<script>alert(1)</script>\\n```')\n  const html = blocksToHtml(blocks)\n  expect(html).not.toContain('<script>')\n  expect(html).toContain('&lt;script&gt;')\n})\n\nit('未闭合代码块取到文末且不吞后续解析', () => {\n  const blocks = markdownToBlocks('```ts\\nconst a = 1')\n  expect(blocks[0]).toEqual({ type: 'code', lang: 'ts', text: 'const a = 1' })\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#B392F0\">it</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'代码块里的 HTML 标签必须被转义'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> blocks</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> markdownToBlocks</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'```html</span><span style=\"color:#79B8FF\">\\n</span><span style=\"color:#9ECBFF\">&#x3C;script>alert(1)&#x3C;/script></span><span style=\"color:#79B8FF\">\\n</span><span style=\"color:#9ECBFF\">```'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> html</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> blocksToHtml</span><span style=\"color:#E1E4E8\">(blocks)</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  expect</span><span style=\"color:#E1E4E8\">(html).not.</span><span style=\"color:#B392F0\">toContain</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'&#x3C;script>'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  expect</span><span style=\"color:#E1E4E8\">(html).</span><span style=\"color:#B392F0\">toContain</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'&#x26;lt;script&#x26;gt;'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#B392F0\">it</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'未闭合代码块取到文末且不吞后续解析'</span><span style=\"color:#E1E4E8\">, () </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> blocks</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> markdownToBlocks</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'```ts</span><span style=\"color:#79B8FF\">\\n</span><span style=\"color:#9ECBFF\">const a = 1'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  expect</span><span style=\"color:#E1E4E8\">(blocks[</span><span style=\"color:#79B8FF\">0</span><span style=\"color:#E1E4E8\">]).</span><span style=\"color:#B392F0\">toEqual</span><span style=\"color:#E1E4E8\">({ type: </span><span style=\"color:#9ECBFF\">'code'</span><span style=\"color:#E1E4E8\">, lang: </span><span style=\"color:#9ECBFF\">'ts'</span><span style=\"color:#E1E4E8\">, text: </span><span style=\"color:#9ECBFF\">'const a = 1'</span><span style=\"color:#E1E4E8\"> })</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "边界意识"
      },
      {
        "type": "paragraph",
        "text": "非法日期、空数组、超长字符串——这些「不会有人这么传」的参数，恰恰是最值得测的。formatRelativeTime 对非法日期返回原文而不是抛错，这个行为就是测试逼出来的设计。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "运行与守护"
      },
      {
        "type": "paragraph",
        "text": "测试挂在 CI 里，和 lint、类型检查并列为一道闸门。本地跑 npm test 秒级出结果，没有任何借口跳过。目前 33 个用例，覆盖三个模块，平均每个用例写下来不到两分钟，比出一次回归的排查成本低一个数量级。"
      }
    ]
  },
  {
    "slug": "github-actions-auto-deploy",
    "title": "github-actions-自动部署",
    "excerpt": "git push 之后的一切自动完成：类型检查、单测、构建、预渲染、发布。CI 配置逐行讲解。",
    "cover": "",
    "publishedAt": "2026-06-25",
    "views": 1268,
    "commentCount": 10,
    "tags": [
      "部署",
      "工具"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "部署这种事，手动做第三次就该写脚本了。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "流水线设计"
      },
      {
        "type": "paragraph",
        "text": "push 触发：装依赖 → 类型检查 → 单测 → 构建（含预渲染和 sitemap）→ 发布产物。任何一步红了，部署不会发生："
      },
      {
        "type": "code",
        "lang": "yaml",
        "text": "name: Deploy\non:\n  push:\n    branches: [main]\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      - uses: actions/setup-node@v4\n        with:\n          node-version-file: .nvmrc\n          cache: npm\n\n      - run: npm ci\n\n      - run: npm run type-check\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build\n\n      - uses: actions/upload-pages-artifact@v3\n        with:\n          path: dist",
        "codeHtml": "<span class=\"line\"><span style=\"color:#85E89D\">name</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">Deploy</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">on</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">  push</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">    branches</span><span style=\"color:#E1E4E8\">: [</span><span style=\"color:#9ECBFF\">main</span><span style=\"color:#E1E4E8\">]</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#85E89D\">jobs</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">  deploy</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">    runs-on</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">ubuntu-latest</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">    steps</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">uses</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">actions/checkout@v4</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">uses</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">actions/setup-node@v4</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">        with</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">          node-version-file</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">.nvmrc</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">          cache</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">run</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm ci</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">run</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm run type-check</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">run</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm run lint</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">run</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm test</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">run</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">npm run build</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      - </span><span style=\"color:#85E89D\">uses</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">actions/upload-pages-artifact@v3</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">        with</span><span style=\"color:#E1E4E8\">:</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">          path</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">dist</span></span>"
      },
      {
        "type": "paragraph",
        "text": "npm ci 而不是 npm install：严格按 lockfile 装，环境绝对可复现。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "顺序有讲究"
      },
      {
        "type": "paragraph",
        "text": "便宜的检查放前面。lint 十秒、类型检查三十秒、单测一分钟，全过了才轮到两分钟的构建。反过来排，每次红都要白等构建。"
      },
      {
        "type": "quote",
        "text": "CI 的价值不是快，是「坏东西绝对上不了线」。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "缓存"
      },
      {
        "type": "paragraph",
        "text": "actions/setup-node 的 cache: npm 一行，把依赖安装从两分钟压到十几秒，整体构建时间从三分钟到五十秒。这是性价比最高的一行配置。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "踩坑"
      },
      {
        "type": "paragraph",
        "text": "Node 版本锁死在 .nvmrc，流水线用 node-version-file 读取。本地能跑线上挂，八成是环境漂移，版本锁死能消掉一大半这类问题。"
      },
      {
        "type": "paragraph",
        "text": "另一个坑是产物路径：预渲染脚本在 postbuild 钩子里跑，如果发布步骤拿错目录（拿了 dist 上层），页面能打开但全是 404。发布前先本地把 dist 目录完整过一遍，CI 只复制本地验证过的流程。"
      }
    ]
  },
  {
    "slug": "night-mode-done-right",
    "title": "夜间模式的正确实现",
    "excerpt": "不做暗色分支判断，只换设计令牌。夜间模式从「全文件搜索替换」变成「覆盖一份变量表」。",
    "cover": "/images/covers/night-mode-done-right.jpg",
    "publishedAt": "2026-06-18",
    "views": 1687,
    "commentCount": 21,
    "tags": [
      "CSS",
      "Vue"
    ],
    "featured": true,
    "body": [
      {
        "type": "paragraph",
        "text": "夜间模式最常见的实现是在组件里写一堆 .night 分支，结果样式文件比业务代码还难维护，每加一个组件都要把暗色判断抄一遍。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "令牌方案"
      },
      {
        "type": "paragraph",
        "text": "所有颜色收敛为 CSS 变量（详见设计令牌那篇），html.night 只覆盖变量表："
      },
      {
        "type": "code",
        "lang": "css",
        "text": "html.night {\n  --bg-page: #111113;\n  --bg-surface: #1c1c1e;\n  --text-primary: #f5f5f7;\n  --text-secondary: #98989d;\n  --shadow-card: 0 1px 3px rgb(0 0 0 / 60%);\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#85E89D\">html</span><span style=\"color:#B392F0\">.night</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-page</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#111113</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-surface</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#1c1c1e</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-primary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#f5f5f7</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-secondary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#98989d</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --shadow-card</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 1</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> 3</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> rgb</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#E1E4E8\"> / </span><span style=\"color:#79B8FF\">60</span><span style=\"color:#F97583\">%</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "组件里没有一行暗色判断，切主题就是换一层皮。判断逻辑收拢到一处，比散落在十个文件里健康一百倍。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "偏好初始化的三级策略"
      },
      {
        "type": "paragraph",
        "text": "主题偏好按优先级读取：localStorage 手动选择优先，没有手动记录就跟随系统 prefers-color-scheme，探测失败兜底浅色："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const saved = localStorage.getItem('theme')\nconst prefersDark =\n  typeof window.matchMedia === 'function' &&\n  window.matchMedia('(prefers-color-scheme: dark)').matches\n\ndocument.documentElement.classList.toggle('night', saved === 'night' || (!saved && prefersDark))",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> saved</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> localStorage.</span><span style=\"color:#B392F0\">getItem</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'theme'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> prefersDark</span><span style=\"color:#F97583\"> =</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  typeof</span><span style=\"color:#E1E4E8\"> window.matchMedia </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'function'</span><span style=\"color:#F97583\"> &#x26;&#x26;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  window.</span><span style=\"color:#B392F0\">matchMedia</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'(prefers-color-scheme: dark)'</span><span style=\"color:#E1E4E8\">).matches</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">document.documentElement.classList.</span><span style=\"color:#B392F0\">toggle</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'night'</span><span style=\"color:#E1E4E8\">, saved </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'night'</span><span style=\"color:#F97583\"> ||</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#E1E4E8\">saved </span><span style=\"color:#F97583\">&#x26;&#x26;</span><span style=\"color:#E1E4E8\"> prefersDark))</span></span>"
      },
      {
        "type": "paragraph",
        "text": "matchMedia 一定要包降级判断：探测 API 不是处处存在，直接调用的代价是整个脚本中断。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "切换动画只给颜色"
      },
      {
        "type": "paragraph",
        "text": "切换瞬间全局 transition 会带来灾难：所有元素的位置变化都在做补间。正确做法是根节点加一个短暂的主题过渡类，只让颜色属性参与动画："
      },
      {
        "type": "code",
        "lang": "css",
        "text": "html.theme-switching *,\nhtml.theme-switching *::before {\n  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#85E89D\">html</span><span style=\"color:#B392F0\">.theme-switching</span><span style=\"color:#85E89D\"> *</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">html</span><span style=\"color:#B392F0\">.theme-switching</span><span style=\"color:#85E89D\"> *</span><span style=\"color:#B392F0\">::before</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  transition</span><span style=\"color:#E1E4E8\">: background-color </span><span style=\"color:#79B8FF\">0.3</span><span style=\"color:#F97583\">s</span><span style=\"color:#79B8FF\"> ease</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#79B8FF\">color</span><span style=\"color:#79B8FF\"> 0.3</span><span style=\"color:#F97583\">s</span><span style=\"color:#79B8FF\"> ease</span><span style=\"color:#E1E4E8\">, border-color </span><span style=\"color:#79B8FF\">0.3</span><span style=\"color:#F97583\">s</span><span style=\"color:#79B8FF\"> ease</span><span style=\"color:#F97583\"> !important</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "300 毫秒后移除这个类。动画只发生在切换瞬间，平时零开销。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "防闪烁"
      },
      {
        "type": "paragraph",
        "text": "深色用户刷新页面时，CSS 加载前的白底闪烁很扎眼。主题类在 head 里用同步脚本写入，赶在首帧渲染之前："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<head>\n  <script>\n    document.documentElement.classList.toggle(\n      'night',\n      localStorage.getItem('theme') === 'night',\n    )\n  </script>\n</head>",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">head</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  &#x3C;</span><span style=\"color:#85E89D\">script</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    document.documentElement.classList.</span><span style=\"color:#B392F0\">toggle</span><span style=\"color:#E1E4E8\">(</span></span>\n<span class=\"line\"><span style=\"color:#9ECBFF\">      'night'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      localStorage.</span><span style=\"color:#B392F0\">getItem</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'theme'</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'night'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    )</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  &#x3C;/</span><span style=\"color:#85E89D\">script</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;/</span><span style=\"color:#85E89D\">head</span><span style=\"color:#E1E4E8\">></span></span>"
      },
      {
        "type": "quote",
        "text": "夜间模式的完成度，体现在没人注意到它的存在。"
      }
    ]
  },
  {
    "slug": "jsdom-smoke-testing",
    "title": "jsdom-冒烟测试实践",
    "excerpt": "不启浏览器、不依赖后端，20 项核心交互 3 分钟跑完。jsdom 冒烟测试的完整实践。",
    "cover": "",
    "publishedAt": "2026-06-10",
    "views": 803,
    "commentCount": 5,
    "tags": [
      "测试"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "每次改完 UI 都手动点一遍？不现实。真浏览器自动化又太重。折中方案：jsdom 冒烟测试。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "基建"
      },
      {
        "type": "paragraph",
        "text": "jsdom 不执行 ES module，先用 Vite 把整个应用打成 IIFE 单文件测试包，再在 jsdom 里挂载运行："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "import { JSDOM } from 'jsdom'\n\nconst dom = await JSDOM.fromFile('dist-smoke/index.html', {\n  runScripts: 'dangerously',\n  resources: 'usable',\n  pretendToBeVisual: true,\n})\n\nawait waitFor(() => dom.window.document.querySelector('.post-card'))",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">import</span><span style=\"color:#E1E4E8\"> { JSDOM } </span><span style=\"color:#F97583\">from</span><span style=\"color:#9ECBFF\"> 'jsdom'</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> dom</span><span style=\"color:#F97583\"> =</span><span style=\"color:#F97583\"> await</span><span style=\"color:#79B8FF\"> JSDOM</span><span style=\"color:#E1E4E8\">.</span><span style=\"color:#B392F0\">fromFile</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'dist-smoke/index.html'</span><span style=\"color:#E1E4E8\">, {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  runScripts: </span><span style=\"color:#9ECBFF\">'dangerously'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  resources: </span><span style=\"color:#9ECBFF\">'usable'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  pretendToBeVisual: </span><span style=\"color:#79B8FF\">true</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">await</span><span style=\"color:#B392F0\"> waitFor</span><span style=\"color:#E1E4E8\">(() </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> dom.window.document.</span><span style=\"color:#B392F0\">querySelector</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'.post-card'</span><span style=\"color:#E1E4E8\">))</span></span>"
      },
      {
        "type": "paragraph",
        "text": "然后逐项断言核心路径：列表渲染、标签筛选、加载更多、进详情、返回恢复滚动位置。每一项都是真实点击事件驱动，不是查 DOM 结构凑数。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "断言要等，不要睡"
      },
      {
        "type": "paragraph",
        "text": "固定 sleep 断言必然时序抖动：机器慢一次全红，机器快一次全浪费。全部换成轮询等待："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "async function waitFor(fn, timeout = 3000) {\n  const start = Date.now()\n  while (Date.now() - start < timeout) {\n    try {\n      const result = fn()\n      if (result) return result\n    } catch {\n      /* 条件未就绪，继续轮询 */\n    }\n    await new Promise((r) => setTimeout(r, 50))\n  }\n  throw new Error('waitFor 超时')\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">async</span><span style=\"color:#F97583\"> function</span><span style=\"color:#B392F0\"> waitFor</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">fn</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">timeout</span><span style=\"color:#F97583\"> =</span><span style=\"color:#79B8FF\"> 3000</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  const</span><span style=\"color:#79B8FF\"> start</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> Date.</span><span style=\"color:#B392F0\">now</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  while</span><span style=\"color:#E1E4E8\"> (Date.</span><span style=\"color:#B392F0\">now</span><span style=\"color:#E1E4E8\">() </span><span style=\"color:#F97583\">-</span><span style=\"color:#E1E4E8\"> start </span><span style=\"color:#F97583\">&#x3C;</span><span style=\"color:#E1E4E8\"> timeout) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    try</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">      const</span><span style=\"color:#79B8FF\"> result</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> fn</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">      if</span><span style=\"color:#E1E4E8\"> (result) </span><span style=\"color:#F97583\">return</span><span style=\"color:#E1E4E8\"> result</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    } </span><span style=\"color:#F97583\">catch</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#6A737D\">      /* 条件未就绪，继续轮询 */</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    await</span><span style=\"color:#F97583\"> new</span><span style=\"color:#79B8FF\"> Promise</span><span style=\"color:#E1E4E8\">((</span><span style=\"color:#FFAB70\">r</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#B392F0\"> setTimeout</span><span style=\"color:#E1E4E8\">(r, </span><span style=\"color:#79B8FF\">50</span><span style=\"color:#E1E4E8\">))</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  throw</span><span style=\"color:#F97583\"> new</span><span style=\"color:#B392F0\"> Error</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'waitFor 超时'</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "环境缺口要补"
      },
      {
        "type": "paragraph",
        "text": "jsdom 不实现 window.matchMedia，页面代码一旦直接调用就抛错并中断整个脚本块——后面所有初始化逻辑全不执行。测试前先 polyfill："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "dom.window.matchMedia = (query) => ({\n  matches: false,\n  media: query,\n  addEventListener() {},\n  removeEventListener() {},\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">dom.window.</span><span style=\"color:#B392F0\">matchMedia</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#FFAB70\">query</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> ({</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  matches: </span><span style=\"color:#79B8FF\">false</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  media: query,</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  addEventListener</span><span style=\"color:#E1E4E8\">() {},</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  removeEventListener</span><span style=\"color:#E1E4E8\">() {},</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "paragraph",
        "text": "这个 polyfill 还帮了大忙：它暴露过一个真实 bug——页面直接调 matchMedia 没有降级，真机某些环境一样会炸。"
      },
      {
        "type": "quote",
        "text": "冒烟测试不求覆盖全，只求核心路径永不静默坏死。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "收益"
      },
      {
        "type": "paragraph",
        "text": "目前 21 项断言 3 分钟跑完，挂在 build 后面自动执行。这几个月它抓回来的回归：滚动恢复残留、加载更多状态丢失、返回按钮失效。每一次都是发布前抓住，不是用户。"
      }
    ]
  },
  {
    "slug": "markdown-workflow",
    "title": "markdown-工作流设计",
    "excerpt": "发文成本决定博客寿命。设计了一套 Markdown + frontmatter 的发文流水线。",
    "cover": "/images/covers/markdown-workflow.jpg",
    "publishedAt": "2026-06-02",
    "views": 1122,
    "commentCount": 8,
    "tags": [
      "工具",
      "随笔"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "很多博客死于一件事：发一篇文章的流程太痛苦。写正文只要半小时，改数据文件、调格式、对位置要一小时，第四次就会放弃。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "设计原则"
      },
      {
        "type": "paragraph",
        "text": "文章就是 articles 目录下的一个 md 文件，frontmatter 声明元信息，正文纯 Markdown："
      },
      {
        "type": "code",
        "lang": "md",
        "text": "---\nslug: my-new-post\ntitle: 新文章标题\nexcerpt: 一句话摘要，列表页展示\ncover: /images/covers/my-new-post.jpg\npublishedAt: 2026-06-02\ntags: [Vue]\n---\n\n正文直接写，支持标题、引文、图片和代码块。",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">---</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">slug</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">my-new-post</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">title</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">新文章标题</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">excerpt</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">一句话摘要，列表页展示</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">cover</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#9ECBFF\">/images/covers/my-new-post.jpg</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">publishedAt</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">2026-06-02</span></span>\n<span class=\"line\"><span style=\"color:#85E89D\">tags</span><span style=\"color:#E1E4E8\">: [</span><span style=\"color:#9ECBFF\">Vue</span><span style=\"color:#E1E4E8\">]</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">---</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">正文直接写，支持标题、引文、图片和代码块。</span></span>"
      },
      {
        "type": "paragraph",
        "text": "保存即完成。dev 和 build 前的钩子自动把目录里所有 md 编译成一个类型安全的数据模块，手滑的机会为零。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "校验前置"
      },
      {
        "type": "paragraph",
        "text": "坏数据在构建期拦下，绝不流进页面。缺必填字段、slug 重复、日期格式不对、正文为空，构建直接报错退出："
      },
      {
        "type": "code",
        "lang": "js",
        "text": "for (const field of ['slug', 'title', 'excerpt', 'publishedAt', 'tags']) {\n  if (!data[field]) fail(file, `frontmatter 缺少必填字段 \"${field}\"`)\n}\nif (seenSlugs.has(data.slug)) fail(file, `slug \"${data.slug}\" 重复`)\nif (!ISO_DATE.test(data.publishedAt)) fail(file, 'publishedAt 必须是 YYYY-MM-DD 格式')",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">for</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> field</span><span style=\"color:#F97583\"> of</span><span style=\"color:#E1E4E8\"> [</span><span style=\"color:#9ECBFF\">'slug'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#9ECBFF\">'title'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#9ECBFF\">'excerpt'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#9ECBFF\">'publishedAt'</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#9ECBFF\">'tags'</span><span style=\"color:#E1E4E8\">]) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#E1E4E8\">data[field]) </span><span style=\"color:#B392F0\">fail</span><span style=\"color:#E1E4E8\">(file, </span><span style=\"color:#9ECBFF\">`frontmatter 缺少必填字段 \"${</span><span style=\"color:#E1E4E8\">field</span><span style=\"color:#9ECBFF\">}\"`</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">if</span><span style=\"color:#E1E4E8\"> (seenSlugs.</span><span style=\"color:#B392F0\">has</span><span style=\"color:#E1E4E8\">(data.slug)) </span><span style=\"color:#B392F0\">fail</span><span style=\"color:#E1E4E8\">(file, </span><span style=\"color:#9ECBFF\">`slug \"${</span><span style=\"color:#E1E4E8\">data</span><span style=\"color:#9ECBFF\">.</span><span style=\"color:#E1E4E8\">slug</span><span style=\"color:#9ECBFF\">}\" 重复`</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#79B8FF\">ISO_DATE</span><span style=\"color:#E1E4E8\">.</span><span style=\"color:#B392F0\">test</span><span style=\"color:#E1E4E8\">(data.publishedAt)) </span><span style=\"color:#B392F0\">fail</span><span style=\"color:#E1E4E8\">(file, </span><span style=\"color:#9ECBFF\">'publishedAt 必须是 YYYY-MM-DD 格式'</span><span style=\"color:#E1E4E8\">)</span></span>"
      },
      {
        "type": "paragraph",
        "text": "报错信息带文件名和字段名，三十秒定位。校验这种事，晚发生一秒都是浪费。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "转换器刻意保持克制"
      },
      {
        "type": "paragraph",
        "text": "Markdown 到页面只支持五种块：标题、段落、引文、图片、代码块。不支持嵌套列表和表格，因为转换器是自己写的，每加一种语法就多一份解析和转义成本。"
      },
      {
        "type": "quote",
        "text": "流水线的意义是把「坚持」变成「顺便」。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "延伸产物"
      },
      {
        "type": "paragraph",
        "text": "sitemap、RSS、预渲染 HTML 全部从同一份数据派生，新文章一发全部自动更新。一次输入，四处产出，这才是数据驱动该有的样子。"
      }
    ]
  },
  {
    "slug": "error-boundary",
    "title": "前端错误边界兜底",
    "excerpt": "一个组件报错不该拖垮整页。用 onErrorCaptured 给应用兜底，白屏问题从此绝迹。",
    "cover": "",
    "publishedAt": "2026-05-26",
    "views": 954,
    "commentCount": 7,
    "tags": [
      "Vue"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "线上见过最冤的白屏：某个边角组件抛了个错，整页跟着陪葬。用户视角里整站挂了，实际只是评论区挂了。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "兜底方案"
      },
      {
        "type": "paragraph",
        "text": "根组件挂 onErrorCaptured，捕获子树错误后上报并阻断传播，返回 false 阻止继续向上炸："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// App.vue\nimport { onErrorCaptured, ref } from 'vue'\n\nconst errorMessage = ref('')\n\nonErrorCaptured((err, instance, info) => {\n  errorMessage.value = `${err.message} (${info})`\n  reportToMonitor(err, info) // 上报监控\n  return false // 阻断传播，整页不崩\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// App.vue</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">import</span><span style=\"color:#E1E4E8\"> { onErrorCaptured, ref } </span><span style=\"color:#F97583\">from</span><span style=\"color:#9ECBFF\"> 'vue'</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> errorMessage</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> ref</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">''</span><span style=\"color:#E1E4E8\">)</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#B392F0\">onErrorCaptured</span><span style=\"color:#E1E4E8\">((</span><span style=\"color:#FFAB70\">err</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">instance</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">info</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  errorMessage.value </span><span style=\"color:#F97583\">=</span><span style=\"color:#9ECBFF\"> `${</span><span style=\"color:#E1E4E8\">err</span><span style=\"color:#9ECBFF\">.</span><span style=\"color:#E1E4E8\">message</span><span style=\"color:#9ECBFF\">} (${</span><span style=\"color:#E1E4E8\">info</span><span style=\"color:#9ECBFF\">})`</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  reportToMonitor</span><span style=\"color:#E1E4E8\">(err, info) </span><span style=\"color:#6A737D\">// 上报监控</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  return</span><span style=\"color:#79B8FF\"> false</span><span style=\"color:#6A737D\"> // 阻断传播，整页不崩</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "paragraph",
        "text": "拿到错误后渲染一个兜底 UI，而不是让 Vue 直接罢工："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<div v-if=\"errorMessage\" class=\"app-fallback\">\n  <p>页面开小差了，部分功能暂时不可用</p>\n  <button type=\"button\" @click=\"errorMessage = ''\">重试</button>\n</div>\n<RouterView v-else />",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">div</span><span style=\"color:#B392F0\"> v-if</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"errorMessage\"</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"app-fallback\"</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  &#x3C;</span><span style=\"color:#85E89D\">p</span><span style=\"color:#E1E4E8\">>页面开小差了，部分功能暂时不可用&#x3C;/</span><span style=\"color:#85E89D\">p</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  &#x3C;</span><span style=\"color:#85E89D\">button</span><span style=\"color:#B392F0\"> type</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"button\"</span><span style=\"color:#B392F0\"> @click</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"errorMessage = ''\"</span><span style=\"color:#E1E4E8\">>重试&#x3C;/</span><span style=\"color:#85E89D\">button</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;/</span><span style=\"color:#85E89D\">div</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#FDAEB7;font-style:italic\">RouterView</span><span style=\"color:#B392F0\"> v-else</span><span style=\"color:#E1E4E8\"> /></span></span>"
      },
      {
        "type": "quote",
        "text": "错误处理的目标不是消灭报错，而是让报错的爆炸半径可控。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "配套动作：环境探测全部封装"
      },
      {
        "type": "paragraph",
        "text": "另一类白屏源头是环境探测类 API。沙箱、老浏览器、爬虫环境里 matchMedia 和 IntersectionObserver 可能不存在，直接调用会抛错并中断整个脚本块——后面所有代码全不执行。全部封装成降级版本："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "export function safeMatchMedia(query: string): MediaQueryList | null {\n  if (typeof window.matchMedia !== 'function') return null\n  try {\n    return window.matchMedia(query)\n  } catch {\n    return null\n  }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">export</span><span style=\"color:#F97583\"> function</span><span style=\"color:#B392F0\"> safeMatchMedia</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">query</span><span style=\"color:#F97583\">:</span><span style=\"color:#79B8FF\"> string</span><span style=\"color:#E1E4E8\">)</span><span style=\"color:#F97583\">:</span><span style=\"color:#B392F0\"> MediaQueryList</span><span style=\"color:#F97583\"> |</span><span style=\"color:#79B8FF\"> null</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">typeof</span><span style=\"color:#E1E4E8\"> window.matchMedia </span><span style=\"color:#F97583\">!==</span><span style=\"color:#9ECBFF\"> 'function'</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">return</span><span style=\"color:#79B8FF\"> null</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  try</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    return</span><span style=\"color:#E1E4E8\"> window.</span><span style=\"color:#B392F0\">matchMedia</span><span style=\"color:#E1E4E8\">(query)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  } </span><span style=\"color:#F97583\">catch</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    return</span><span style=\"color:#79B8FF\"> null</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "调用方拿到 null 就走兜底分支：系统主题探测失败就默认浅色，观察器不存在就直接加载图片。功能降级，永不中断。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "验证方式"
      },
      {
        "type": "paragraph",
        "text": "冒烟测试里专门有一项：监听 jsdom 的 window error 事件，整页跑完不允许有未捕获报错。兜底逻辑没有测试护航，迟早被后续重构悄悄拆掉。"
      }
    ]
  },
  {
    "slug": "design-tokens-theme",
    "title": "设计令牌与主题系统",
    "excerpt": "颜色、间距、圆角、动效全部收敛为 CSS 变量，夜间模式只需覆盖一份令牌。",
    "cover": "/images/covers/design-tokens-theme.jpg",
    "publishedAt": "2026-05-18",
    "views": 1447,
    "commentCount": 13,
    "tags": [
      "CSS"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "重构前样式里散落着几十个硬编码色值，夜间模式等于全文件搜索替换，改一次崩三处。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "令牌化"
      },
      {
        "type": "paragraph",
        "text": "品牌色、表面色、文字色、描边、阴影、圆角、动效曲线全部收敛为 CSS 变量，组件内禁止硬编码："
      },
      {
        "type": "code",
        "lang": "css",
        "text": ":root {\n  --brand: #4a7dff;\n  --bg-page: #f7f7f8;\n  --bg-surface: #ffffff;\n  --text-primary: #1d1d1f;\n  --text-secondary: #6e6e73;\n  --radius-md: 12px;\n  --shadow-card: 0 1px 3px rgb(0 0 0 / 8%);\n  --duration-base: 0.25s;\n  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#B392F0\">:root</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --brand</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#4a7dff</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-page</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#f7f7f8</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-surface</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#ffffff</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-primary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#1d1d1f</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-secondary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#6e6e73</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --radius-md</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">12</span><span style=\"color:#F97583\">px</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --shadow-card</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 1</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> 3</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> rgb</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#E1E4E8\"> / </span><span style=\"color:#79B8FF\">8</span><span style=\"color:#F97583\">%</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --duration-base</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">0.25</span><span style=\"color:#F97583\">s</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --ease-standard</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">cubic-bezier</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">0.4</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#79B8FF\">0.2</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#79B8FF\">1</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "组件里只允许引用令牌，一个裸色值都不留："
      },
      {
        "type": "code",
        "lang": "css",
        "text": ".post-card {\n  background: var(--bg-surface);\n  border-radius: var(--radius-md);\n  box-shadow: var(--shadow-card);\n  transition: color var(--duration-base) var(--ease-standard);\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#B392F0\">.post-card</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  background</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">var</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">--bg-surface</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  border-radius</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">var</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">--radius-md</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  box-shadow</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">var</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">--shadow-card</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#79B8FF\">  transition</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">color</span><span style=\"color:#79B8FF\"> var</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">--duration-base</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#79B8FF\">var</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">--ease-standard</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "命名按用途，不按色值"
      },
      {
        "type": "paragraph",
        "text": "令牌叫 --text-secondary 而不是 --gray-500，叫 --bg-surface 而不是 --white。色值会随设计改版变，用途不会。这个命名纪律是令牌系统能长期维护的前提。"
      },
      {
        "type": "quote",
        "text": "主题系统正确的打开方式：组件零感知，只换令牌。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "效果"
      },
      {
        "type": "paragraph",
        "text": "夜间模式只需在 html.night 里覆盖一份令牌表，所有组件自动适配："
      },
      {
        "type": "code",
        "lang": "css",
        "text": "html.night {\n  --bg-page: #111113;\n  --bg-surface: #1c1c1e;\n  --text-primary: #f5f5f7;\n  --text-secondary: #98989d;\n  --shadow-card: 0 1px 3px rgb(0 0 0 / 60%);\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#85E89D\">html</span><span style=\"color:#B392F0\">.night</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-page</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#111113</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --bg-surface</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#1c1c1e</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-primary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#f5f5f7</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --text-secondary</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">#98989d</span><span style=\"color:#E1E4E8\">;</span></span>\n<span class=\"line\"><span style=\"color:#FFAB70\">  --shadow-card</span><span style=\"color:#E1E4E8\">: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 1</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> 3</span><span style=\"color:#F97583\">px</span><span style=\"color:#79B8FF\"> rgb</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#79B8FF\">0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#79B8FF\"> 0</span><span style=\"color:#E1E4E8\"> / </span><span style=\"color:#79B8FF\">60</span><span style=\"color:#F97583\">%</span><span style=\"color:#E1E4E8\">);</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "新增页面天然继承两套主题，这才是令牌系统的复利。后来加的深色代码块也只花了十分钟——因为文章容器只感知令牌，代码块自己定义局部变量就行。"
      }
    ]
  },
  {
    "slug": "accessibility-basics",
    "title": "无障碍那点事",
    "excerpt": "键盘用户和读屏用户不是少数派幻想。给博客补无障碍细节的记录。",
    "cover": "",
    "publishedAt": "2026-05-09",
    "views": 689,
    "commentCount": 4,
    "tags": [
      "随笔",
      "CSS"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "给博客过了一遍无障碍，改完之后整个产品的「完成度」上了一个台阶。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "改了什么"
      },
      {
        "type": "paragraph",
        "text": "跳转链接让键盘用户直达正文，不用挨个 Tab 过导航："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<a class=\"skip-link\" href=\"#main\">跳到主要内容</a>\n<main id=\"main\" tabindex=\"-1\">\n  <!-- 文章内容 -->\n</main>",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">a</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"skip-link\"</span><span style=\"color:#B392F0\"> href</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"#main\"</span><span style=\"color:#E1E4E8\">>跳到主要内容&#x3C;/</span><span style=\"color:#85E89D\">a</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">main</span><span style=\"color:#B392F0\"> id</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"main\"</span><span style=\"color:#B392F0\"> tabindex</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"-1\"</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#6A737D\">  &#x3C;!-- 文章内容 --></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;/</span><span style=\"color:#85E89D\">main</span><span style=\"color:#E1E4E8\">></span></span>"
      },
      {
        "type": "paragraph",
        "text": "交互按钮补齐 aria-label。图标按钮尤其重灾区，读屏软件只会念出空空如也："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<!-- 读屏用户听到的只有「按钮」，等于没有 -->\n<button class=\"theme-toggle\">🌙</button>\n\n<!-- 至少告诉他这是个什么按钮 -->\n<button class=\"theme-toggle\" aria-label=\"切换夜间模式\">🌙</button>",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">&#x3C;!-- 读屏用户听到的只有「按钮」，等于没有 --></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">button</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"theme-toggle\"</span><span style=\"color:#E1E4E8\">>🌙&#x3C;/</span><span style=\"color:#85E89D\">button</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#6A737D\">&#x3C;!-- 至少告诉他这是个什么按钮 --></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">button</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"theme-toggle\"</span><span style=\"color:#B392F0\"> aria-label</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"切换夜间模式\"</span><span style=\"color:#E1E4E8\">>🌙&#x3C;/</span><span style=\"color:#85E89D\">button</span><span style=\"color:#E1E4E8\">></span></span>"
      },
      {
        "type": "paragraph",
        "text": "弹窗和抽屉的焦点管理要做闭环：打开时把焦点移进去，关闭时归还给触发按钮，不然键盘用户的焦点会掉回页面开头。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "列表语义的坑"
      },
      {
        "type": "paragraph",
        "text": "顺手修了一个自己埋的雷：列表页标题原来用 h1，一页出现十几个 h1，读屏软件的标题大纲直接报废。列表项统一降级为 h2，页面级 h1 只留给详情页标题。"
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<!-- 错误：一页多个 h1 -->\n<h1 class=\"post-card__title\">{{ post.title }}</h1>\n\n<!-- 正确：列表用 h2，时间交给 time 标签 -->\n<h2 class=\"post-card__title\">{{ post.title }}</h2>\n<time :datetime=\"post.publishedAt\">{{ relativeTime }}</time>",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">&#x3C;!-- 错误：一页多个 h1 --></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">h1</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"post-card__title\"</span><span style=\"color:#E1E4E8\">>{{ post.title }}&#x3C;/</span><span style=\"color:#85E89D\">h1</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#6A737D\">&#x3C;!-- 正确：列表用 h2，时间交给 time 标签 --></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">h2</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"post-card__title\"</span><span style=\"color:#E1E4E8\">>{{ post.title }}&#x3C;/</span><span style=\"color:#85E89D\">h2</span><span style=\"color:#E1E4E8\">></span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">time</span><span style=\"color:#B392F0\"> :datetime</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"post.publishedAt\"</span><span style=\"color:#E1E4E8\">>{{ relativeTime }}&#x3C;/</span><span style=\"color:#85E89D\">time</span><span style=\"color:#E1E4E8\">></span></span>"
      },
      {
        "type": "quote",
        "text": "无障碍不是慈善，是把「能用的产品」变成「好用的产品」。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "顺手修的"
      },
      {
        "type": "paragraph",
        "text": "对比度不足的灰色文字全部加深一档，读屏模式和夜间模式都受益，视觉上反而更精致。对比度是设计问题，不只是合规问题。"
      }
    ]
  },
  {
    "slug": "scrollbehavior-notes",
    "title": "scrollbehavior-踩坑记录",
    "excerpt": "scrollBehavior 写了 savedPosition 却不生效？查了一晚上，凶手是页面过渡动画。",
    "cover": "",
    "publishedAt": "2026-04-30",
    "views": 1076,
    "commentCount": 9,
    "tags": [
      "Vue"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "明明配置了 savedPosition 恢复，返回上一页却总是落在错误的位置。这个问题断断续续查了一晚上。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "表象"
      },
      {
        "type": "paragraph",
        "text": "从列表页进详情页，返回后浏览器记住的滚动位置时而生效时而失效；偶尔还会先跳对位置、再被拽回顶部，像两段代码在打架。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "真相"
      },
      {
        "type": "paragraph",
        "text": "页面切换用了 out-in 过渡。scrollBehavior 触发时新页面还没挂载，旧页面还占着 DOM。此刻执行 window.scrollTo，滚动高度按旧页面算，位置自然不对："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// 错误示范：时序上滚了个寂寞\nconst router = createRouter({\n  scrollBehavior(to, from, savedPosition) {\n    if (savedPosition) {\n      window.scrollTo(savedPosition.left, savedPosition.top)\n    }\n    return { top: 0 }\n  },\n})",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// 错误示范：时序上滚了个寂寞</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> router</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> createRouter</span><span style=\"color:#E1E4E8\">({</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  scrollBehavior</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">to</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">from</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">savedPosition</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    if</span><span style=\"color:#E1E4E8\"> (savedPosition) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      window.</span><span style=\"color:#B392F0\">scrollTo</span><span style=\"color:#E1E4E8\">(savedPosition.left, savedPosition.top)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    return</span><span style=\"color:#E1E4E8\"> { top: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#E1E4E8\"> }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>"
      },
      {
        "type": "quote",
        "text": "过渡动画和滚动恢复的执行时序冲突，是单页应用的经典暗坑。两套机制各干各的，谁也不等谁。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "解法：把滚动时机交给过渡"
      },
      {
        "type": "paragraph",
        "text": "scrollBehavior 里只记录位置并返回 false（跳过默认滚动），等新页面的 enter 钩子触发、DOM 真正就绪后再滚："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "let pendingRestore: { left: number; top: number } | null = null\n\nconst router = createRouter({\n  scrollBehavior(to, from, savedPosition) {\n    if (savedPosition) {\n      pendingRestore = savedPosition\n      return false // 先不滚，等过渡完成\n    }\n    pendingRestore = null\n    return { top: 0 }\n  },\n})\n\n// 页面过渡的 @enter 钩子里执行真正的滚动\nfunction onPageEnter() {\n  if (pendingRestore) {\n    window.scrollTo(pendingRestore.left, pendingRestore.top)\n    pendingRestore = null\n  }\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">let</span><span style=\"color:#E1E4E8\"> pendingRestore</span><span style=\"color:#F97583\">:</span><span style=\"color:#E1E4E8\"> { </span><span style=\"color:#FFAB70\">left</span><span style=\"color:#F97583\">:</span><span style=\"color:#79B8FF\"> number</span><span style=\"color:#E1E4E8\">; </span><span style=\"color:#FFAB70\">top</span><span style=\"color:#F97583\">:</span><span style=\"color:#79B8FF\"> number</span><span style=\"color:#E1E4E8\"> } </span><span style=\"color:#F97583\">|</span><span style=\"color:#79B8FF\"> null</span><span style=\"color:#F97583\"> =</span><span style=\"color:#79B8FF\"> null</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> router</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> createRouter</span><span style=\"color:#E1E4E8\">({</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  scrollBehavior</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">to</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">from</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">savedPosition</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    if</span><span style=\"color:#E1E4E8\"> (savedPosition) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      pendingRestore </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> savedPosition</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">      return</span><span style=\"color:#79B8FF\"> false</span><span style=\"color:#6A737D\"> // 先不滚，等过渡完成</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    pendingRestore </span><span style=\"color:#F97583\">=</span><span style=\"color:#79B8FF\"> null</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    return</span><span style=\"color:#E1E4E8\"> { top: </span><span style=\"color:#79B8FF\">0</span><span style=\"color:#E1E4E8\"> }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">})</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#6A737D\">// 页面过渡的 @enter 钩子里执行真正的滚动</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">function</span><span style=\"color:#B392F0\"> onPageEnter</span><span style=\"color:#E1E4E8\">() {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">  if</span><span style=\"color:#E1E4E8\"> (pendingRestore) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    window.</span><span style=\"color:#B392F0\">scrollTo</span><span style=\"color:#E1E4E8\">(pendingRestore.left, pendingRestore.top)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    pendingRestore </span><span style=\"color:#F97583\">=</span><span style=\"color:#79B8FF\"> null</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "还有一个隐藏坑"
      },
      {
        "type": "paragraph",
        "text": "同组件路由之间的导航（比如首页和首页加筛选参数）不会触发过渡动画，enter 钩子不执行，pendingRestore 就成了残留状态，下次随便一次导航都可能被它误滚一次。解法是前进导航时主动清空记录。"
      },
      {
        "type": "paragraph",
        "text": "修完这两处，返回恢复终于稳定了。时序问题没有玄学，只有没对齐的钩子。"
      }
    ]
  },
  {
    "slug": "bundle-size-ten-tips",
    "title": "打包体积优化十连",
    "excerpt": "首屏 JS 从 380KB 压到 55KB 的完整记录：分包、懒加载、按需引入，十招全部实战验证。",
    "cover": "",
    "publishedAt": "2026-04-21",
    "views": 1593,
    "commentCount": 17,
    "tags": [
      "性能优化",
      "构建"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "首屏 380KB JS，弱网下白屏三秒，忍不了。这次集中治理，完整记录每一步的收益。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "第一招：路由级代码分割"
      },
      {
        "type": "paragraph",
        "text": "收益最大的一招。所有页面打进一个包，等于让首屏用户替详情页、归档页买单。改成路由懒加载后首包直接砍半："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const routes = [\n  { path: '/', component: HomeView },\n  {\n    path: '/post/:slug',\n    component: () => import('@/views/PostView.vue'),\n  },\n  {\n    path: '/archives',\n    component: () => import('@/views/ArchiveView.vue'),\n  },\n]",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> routes</span><span style=\"color:#F97583\"> =</span><span style=\"color:#E1E4E8\"> [</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  { path: </span><span style=\"color:#9ECBFF\">'/'</span><span style=\"color:#E1E4E8\">, component: HomeView },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    path: </span><span style=\"color:#9ECBFF\">'/post/:slug'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    component</span><span style=\"color:#E1E4E8\">: () </span><span style=\"color:#F97583\">=></span><span style=\"color:#F97583\"> import</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'@/views/PostView.vue'</span><span style=\"color:#E1E4E8\">),</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    path: </span><span style=\"color:#9ECBFF\">'/archives'</span><span style=\"color:#E1E4E8\">,</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    component</span><span style=\"color:#E1E4E8\">: () </span><span style=\"color:#F97583\">=></span><span style=\"color:#F97583\"> import</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'@/views/ArchiveView.vue'</span><span style=\"color:#E1E4E8\">),</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">]</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "第二招：框架与业务分包"
      },
      {
        "type": "paragraph",
        "text": "框架代码半年不变，业务代码天天变。分开打包后，用户浏览器里的框架缓存长期有效："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "// vite.config.ts\nbuild: {\n  rollupOptions: {\n    output: {\n      manualChunks(id) {\n        if (id.includes('node_modules')) return 'vue'\n        return undefined\n      },\n    },\n  },\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#6A737D\">// vite.config.ts</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">build</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  rollupOptions</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">    output</span><span style=\"color:#E1E4E8\">: {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">      manualChunks</span><span style=\"color:#E1E4E8\">(id) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">        if</span><span style=\"color:#E1E4E8\"> (id.</span><span style=\"color:#B392F0\">includes</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'node_modules'</span><span style=\"color:#E1E4E8\">)) </span><span style=\"color:#F97583\">return</span><span style=\"color:#9ECBFF\"> 'vue'</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">        return</span><span style=\"color:#79B8FF\"> undefined</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "注意 Vite 8 里 manualChunks 只接受函数形式，对象写法会直接报错。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "第三招：干掉全量引入"
      },
      {
        "type": "paragraph",
        "text": "「顺手装」的依赖最会偷偷吃体积。一个只用了两个图标库函数的组件，全量引入多背了 60KB。按需引入后只剩 3KB。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "第四到十招（速览）"
      },
      {
        "type": "paragraph",
        "text": "CSS 代码分割是被严重低估的一招，拆完首屏样式体积降了 40%。剩下的按收益排序：图片压缩、Tree Shaking 确认开启、分析产物找大依赖、动态 import 拆低频功能、移除死代码、生产环境关掉 sourcemap。"
      },
      {
        "type": "quote",
        "text": "体积优化的本质是：只加载当前页面需要的东西。每招单看都微小，叠起来就是 380KB 到 55KB 的差距。"
      }
    ]
  },
  {
    "slug": "lazy-load-directive",
    "title": "图片懒加载指令封装",
    "excerpt": "把 IntersectionObserver 封装成 v-lazy-bg 指令，一行指令搞定背景图懒加载。",
    "cover": "",
    "publishedAt": "2026-04-12",
    "views": 892,
    "commentCount": 6,
    "tags": [
      "Vue",
      "性能优化"
    ],
    "featured": false,
    "body": [
      {
        "type": "paragraph",
        "text": "列表页几十张封面图，一次性全加载等于自杀。原生 loading 属性只管 img 标签，背景图就得自己来。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "指令设计"
      },
      {
        "type": "paragraph",
        "text": "封装成 v-lazy-bg 指令：挂载时用 IntersectionObserver 观察元素，进入视口（提前 200px）才把真实图写入样式。核心实现不到三十行："
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "import type { Directive } from 'vue'\n\ntype LazyEl = HTMLElement & { _observer?: IntersectionObserver }\n\nexport const lazyBg: Directive<LazyEl, string> = {\n  mounted(el, binding) {\n    if (!binding.value) return\n    if (typeof IntersectionObserver === 'undefined') {\n      el.style.backgroundImage = `url(\"${binding.value}\")`\n      return\n    }\n    const observer = new IntersectionObserver(\n      (entries, obs) => {\n        for (const entry of entries) {\n          if (!entry.isIntersecting) continue\n          el.style.backgroundImage = `url(\"${binding.value}\")`\n          obs.unobserve(el)\n        }\n      },\n      { rootMargin: '200px 0px' },\n    )\n    el._observer = observer\n    observer.observe(el)\n  },\n  unmounted(el) {\n    el._observer?.disconnect()\n  },\n}",
        "codeHtml": "<span class=\"line\"><span style=\"color:#F97583\">import</span><span style=\"color:#F97583\"> type</span><span style=\"color:#E1E4E8\"> { Directive } </span><span style=\"color:#F97583\">from</span><span style=\"color:#9ECBFF\"> 'vue'</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">type</span><span style=\"color:#B392F0\"> LazyEl</span><span style=\"color:#F97583\"> =</span><span style=\"color:#B392F0\"> HTMLElement</span><span style=\"color:#F97583\"> &#x26;</span><span style=\"color:#E1E4E8\"> { </span><span style=\"color:#FFAB70\">_observer</span><span style=\"color:#F97583\">?:</span><span style=\"color:#B392F0\"> IntersectionObserver</span><span style=\"color:#E1E4E8\"> }</span></span>\n<span class=\"line\"></span>\n<span class=\"line\"><span style=\"color:#F97583\">export</span><span style=\"color:#F97583\"> const</span><span style=\"color:#79B8FF\"> lazyBg</span><span style=\"color:#F97583\">:</span><span style=\"color:#B392F0\"> Directive</span><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#B392F0\">LazyEl</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#79B8FF\">string</span><span style=\"color:#E1E4E8\">> </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  mounted</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">el</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">binding</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#E1E4E8\">binding.value) </span><span style=\"color:#F97583\">return</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">typeof</span><span style=\"color:#E1E4E8\"> IntersectionObserver </span><span style=\"color:#F97583\">===</span><span style=\"color:#9ECBFF\"> 'undefined'</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      el.style.backgroundImage </span><span style=\"color:#F97583\">=</span><span style=\"color:#9ECBFF\"> `url(\"${</span><span style=\"color:#E1E4E8\">binding</span><span style=\"color:#9ECBFF\">.</span><span style=\"color:#E1E4E8\">value</span><span style=\"color:#9ECBFF\">}\")`</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">      return</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    }</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">    const</span><span style=\"color:#79B8FF\"> observer</span><span style=\"color:#F97583\"> =</span><span style=\"color:#F97583\"> new</span><span style=\"color:#B392F0\"> IntersectionObserver</span><span style=\"color:#E1E4E8\">(</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      (</span><span style=\"color:#FFAB70\">entries</span><span style=\"color:#E1E4E8\">, </span><span style=\"color:#FFAB70\">obs</span><span style=\"color:#E1E4E8\">) </span><span style=\"color:#F97583\">=></span><span style=\"color:#E1E4E8\"> {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">        for</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">const</span><span style=\"color:#79B8FF\"> entry</span><span style=\"color:#F97583\"> of</span><span style=\"color:#E1E4E8\"> entries) {</span></span>\n<span class=\"line\"><span style=\"color:#F97583\">          if</span><span style=\"color:#E1E4E8\"> (</span><span style=\"color:#F97583\">!</span><span style=\"color:#E1E4E8\">entry.isIntersecting) </span><span style=\"color:#F97583\">continue</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">          el.style.backgroundImage </span><span style=\"color:#F97583\">=</span><span style=\"color:#9ECBFF\"> `url(\"${</span><span style=\"color:#E1E4E8\">binding</span><span style=\"color:#9ECBFF\">.</span><span style=\"color:#E1E4E8\">value</span><span style=\"color:#9ECBFF\">}\")`</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">          obs.</span><span style=\"color:#B392F0\">unobserve</span><span style=\"color:#E1E4E8\">(el)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">        }</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">      { rootMargin: </span><span style=\"color:#9ECBFF\">'200px 0px'</span><span style=\"color:#E1E4E8\"> },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    )</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    el._observer </span><span style=\"color:#F97583\">=</span><span style=\"color:#E1E4E8\"> observer</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    observer.</span><span style=\"color:#B392F0\">observe</span><span style=\"color:#E1E4E8\">(el)</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#B392F0\">  unmounted</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#FFAB70\">el</span><span style=\"color:#E1E4E8\">) {</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">    el._observer?.</span><span style=\"color:#B392F0\">disconnect</span><span style=\"color:#E1E4E8\">()</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">  },</span></span>\n<span class=\"line\"><span style=\"color:#E1E4E8\">}</span></span>"
      },
      {
        "type": "paragraph",
        "text": "模板里用起来就是一行："
      },
      {
        "type": "code",
        "lang": "html",
        "text": "<div v-lazy-bg=\"post.cover\" class=\"post-card__thumb\" />",
        "codeHtml": "<span class=\"line\"><span style=\"color:#E1E4E8\">&#x3C;</span><span style=\"color:#85E89D\">div</span><span style=\"color:#B392F0\"> v-lazy-bg</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"post.cover\"</span><span style=\"color:#B392F0\"> class</span><span style=\"color:#E1E4E8\">=</span><span style=\"color:#9ECBFF\">\"post-card__thumb\"</span><span style=\"color:#FDAEB7;font-style:italic\"> /</span><span style=\"color:#E1E4E8\">></span></span>"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "两个必须处理的细节"
      },
      {
        "type": "paragraph",
        "text": "第一是卸载清理。unmounted 里不 disconnect 的话，单页应用切几次路由监听器就堆成山了。这个坑不报错，只会慢慢变卡，很难排查。"
      },
      {
        "type": "paragraph",
        "text": "第二是值兼容。值可能是裸路径，也可能是 linear-gradient 这种 CSS 值，写入前要判断是否需要包 url()，否则渐变和图片只能活一个。"
      },
      {
        "type": "quote",
        "text": "兜底逻辑的优先级永远高于炫技：环境不支持观察器就立即加载，宁可多加载也不能让图永远不出来。"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "值变化怎么办"
      },
      {
        "type": "paragraph",
        "text": "列表筛选后复用的卡片组件会拿到新 cover，updated 钩子里要断开旧观察器、重建新的。偷懒不处理的话，切标签会出现图对不上号的灵异现象。"
      }
    ]
  },
  {
    "slug": "blog-launch",
    "title": "博客开张",
    "excerpt": "折腾两个周末，博客总算开张了。从选型到上线，把踩的坑和做的决定都记录下来。",
    "cover": "/images/covers/blog-launch.jpg",
    "publishedAt": "2026-04-01",
    "views": 2461,
    "commentCount": 36,
    "tags": [
      "随笔"
    ],
    "featured": true,
    "body": [
      {
        "type": "paragraph",
        "text": "折腾两个周末，博客总算开张了。"
      },
      {
        "type": "heading",
        "id": "sec-1",
        "text": "为什么自己写"
      },
      {
        "type": "paragraph",
        "text": "托管平台很方便，但样式不由自己说了算，总感觉是给别人打工。自己写的博客，每一像素都能讲出理由。另外这也是最好的练手项目：小而完整，从构建到部署全链路都能自己扛。"
      },
      {
        "type": "heading",
        "id": "sec-2",
        "text": "技术选型"
      },
      {
        "type": "paragraph",
        "text": "最终定了 Vue 3 + Vite + TypeScript，纯静态输出。数据就是一组 Markdown 文件，构建时编译成类型安全的数据模块。不上 UI 组件库，阅读型站点的样式必须自己说了算。"
      },
      {
        "type": "paragraph",
        "text": "目录结构一开始就定得很简单："
      },
      {
        "type": "code",
        "lang": "text",
        "text": "├── articles/        # 文章源文件（Markdown）\n├── public/          # 静态资源\n├── scripts/         # 构建脚本（编译文章、预渲染）\n└── src/             # 应用代码\n    ├── components/\n    ├── views/\n    └── data/",
        "codeHtml": "<span class=\"line\"><span>├── articles/        # 文章源文件（Markdown）</span></span>\n<span class=\"line\"><span>├── public/          # 静态资源</span></span>\n<span class=\"line\"><span>├── scripts/         # 构建脚本（编译文章、预渲染）</span></span>\n<span class=\"line\"><span>└── src/             # 应用代码</span></span>\n<span class=\"line\"><span>    ├── components/</span></span>\n<span class=\"line\"><span>    ├── views/</span></span>\n<span class=\"line\"><span>    └── data/</span></span>"
      },
      {
        "type": "heading",
        "id": "sec-3",
        "text": "踩的第一个坑"
      },
      {
        "type": "paragraph",
        "text": "第一版把文章数据硬编码在 TS 文件里，加一篇新文章要改数组、小心插入位置、担心逗号。写到第三篇就受不了了，这直接催生了后来的 Markdown 发文流水线——那是另一个故事，后面单独写一篇。"
      },
      {
        "type": "quote",
        "text": "独立博客的价值不在阅读量，在于有一块完全属于自己的地。"
      },
      {
        "type": "heading",
        "id": "sec-4",
        "text": "后续计划"
      },
      {
        "type": "paragraph",
        "text": "接入评论、加归档页、写一套自动部署。这个坑会慢慢填，文章会慢慢写。这是第一篇文章，就当是奠基石。"
      }
    ]
  }
]
