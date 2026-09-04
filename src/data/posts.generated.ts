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
        "text": "Vite 8 底层换成了 Rolldown，性能提升是真实的：冷启动肉眼可见地快，生产构建时间近乎减半。"
      },
      {
        "type": "heading",
        "text": "迁移成本"
      },
      {
        "type": "paragraph",
        "text": "绝大多数项目零改动直迁。唯一踩到的 breaking change：manualChunks 不再接受对象形式，要改成函数返回。报错信息清晰，照着改就行。"
      },
      {
        "type": "quote",
        "text": "工具链升级的正确姿势：先看 changelog 的 breaking changes，再动手。"
      },
      {
        "type": "heading",
        "text": "体感"
      },
      {
        "type": "paragraph",
        "text": "开发时的依赖预构建几乎无感，改代码的热更新稳定在毫秒级。这种「无感」恰恰是工具链成熟的标志。"
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
        "text": "组合式 API 最大的变化不是写法，是「逻辑的组织方式」。"
      },
      {
        "type": "heading",
        "text": "状态放哪"
      },
      {
        "type": "paragraph",
        "text": "全局状态（主题、抽屉、搜索）在根组件挂载一次，子组件 useXxx 取同一实例；页面局部状态留在页面组件里。判断标准：谁的生命周期该管它。"
      },
      {
        "type": "quote",
        "text": "composable 抽取的时机是第二次重复，不是第一次出现。"
      },
      {
        "type": "heading",
        "text": "类型体验"
      },
      {
        "type": "paragraph",
        "text": "defineProps 泛型、computed 自动推导、ref 解包，TS 全程无断言。类型即文档，重构时尤其明显。"
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
        "text": "实现"
      },
      {
        "type": "paragraph",
        "text": "grid-template-columns: 8fr 2fr，对齐方式交给 align-items。侧栏不随主列增长，天然 sticky 友好。"
      },
      {
        "type": "quote",
        "text": "布局系统的进步，就是把 hack 变成语义。"
      },
      {
        "type": "heading",
        "text": "响应式收窄"
      },
      {
        "type": "paragraph",
        "text": "992px 以下侧栏隐藏、主列占满；600px 以下缩略图改纵向堆叠。断点的原则是内容先妥协，布局后妥协。"
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
        "text": "重构不是推倒重来，是把散落的逻辑收拢到该在的位置。"
      },
      {
        "type": "heading",
        "text": "架构决策"
      },
      {
        "type": "paragraph",
        "text": "内容与结构分离是第一原则：文章、导航、友链全部抽成类型安全的数据模块，组件只负责渲染。composables 收拢主题、搜索、轮播等全局状态。"
      },
      {
        "type": "quote",
        "text": "好架构的标志：加一篇文章、加一个页面，都不需要「碰」框架代码。"
      },
      {
        "type": "heading",
        "text": "验证闭环"
      },
      {
        "type": "paragraph",
        "text": "lint、类型检查、单测、构建、jsdom 冒烟五道关卡全绿才算完。重构最大的风险不是写错，是「以为没写错」。"
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
        "text": "TS 开 strict 是痛一时爽一时的投资。"
      },
      {
        "type": "heading",
        "text": "为什么全开"
      },
      {
        "type": "paragraph",
        "text": "strict 模式会在编译期抓住大量「运行时才炸」的问题：可能为 undefined 的索引访问、漏判的分支、隐式 any。开着难受，关了后悔。"
      },
      {
        "type": "quote",
        "text": "类型系统的收益和严格程度成正比。"
      },
      {
        "type": "heading",
        "text": "实战感受"
      },
      {
        "type": "paragraph",
        "text": "noUncheckedIndexedAccess 最狠也最值：所有数组索引访问都必须判空。配合「查找失败返回 undefined 而不是抛错」的约定，整个数据层的健壮性上了一个台阶。"
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
        "text": "演进"
      },
      {
        "type": "paragraph",
        "text": "老方案监听 scroll 事件算几何，节流写不好就是性能灾难。IntersectionObserver 把判断交给浏览器，主线程零开销。"
      },
      {
        "type": "quote",
        "text": "让浏览器做浏览器擅长的事。"
      },
      {
        "type": "heading",
        "text": "兜底"
      },
      {
        "type": "paragraph",
        "text": "不支持 IO 的环境直接降级为立即加载。兼容性兜底的原则：宁可多加载，不能白屏。"
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
        "text": "单页应用再漂亮，搜索引擎爬虫看到的只有一个空 div。对个人博客来说这是致命伤。"
      },
      {
        "type": "heading",
        "text": "预渲染方案"
      },
      {
        "type": "paragraph",
        "text": "文章是纯静态数据，最适合构建时生成：每篇文章输出一份完整 HTML，标题、描述、og 标签、正文全文都在。浏览器打开后应用照常接管，用户无感知。"
      },
      {
        "type": "quote",
        "text": "预渲染的本质：给爬虫看的和给人看的，是同一份内容的不同时刻快照。"
      },
      {
        "type": "heading",
        "text": "配套"
      },
      {
        "type": "paragraph",
        "text": "sitemap 和 robots.txt 同样构建时生成，从文章数据派生，永不手工同步。"
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
        "text": "为什么做"
      },
      {
        "type": "paragraph",
        "text": "博客没有推送算法，读者看完走了大概率不再回来。RSS 是唯一让读者「订阅」你的机制，订阅者属于你的域名，不经过任何平台。"
      },
      {
        "type": "quote",
        "text": "平台的粉丝是租的，RSS 订阅者是自己的。"
      },
      {
        "type": "heading",
        "text": "做法"
      },
      {
        "type": "paragraph",
        "text": "构建时从文章数据自动生成 feed.xml，新文章自动进流。零维护成本，被动收益。"
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
        "text": "从哪测起"
      },
      {
        "type": "paragraph",
        "text": "纯函数性价比最高：时间格式化、计数格式化、搜索过滤、Markdown 转换器。输入输出明确，一行断言一个行为。"
      },
      {
        "type": "quote",
        "text": "先测逻辑，再测交互；先测纯函数，再测组件。"
      },
      {
        "type": "heading",
        "text": "边界意识"
      },
      {
        "type": "paragraph",
        "text": "非法日期、空数组、HTML 注入字符串——这些「不会有人这么传」的参数，恰恰是最值得测的。转换器的 XSS 转义测试就是在攻防里长出来的。"
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
        "text": "流水线设计"
      },
      {
        "type": "paragraph",
        "text": "push 触发：装依赖 → 类型检查 → 单测 → 构建（含预渲染和 sitemap）→ 发布产物。任何一步红了，部署不会发生。"
      },
      {
        "type": "quote",
        "text": "CI 的价值不是快，是「坏东西绝对上不了线」。"
      },
      {
        "type": "heading",
        "text": "踩坑"
      },
      {
        "type": "paragraph",
        "text": "Node 版本要锁死在 .nvmrc，本地能跑线上挂多半是环境漂移。缓存 node_modules 能把构建时间从三分钟压到五十秒。"
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
        "text": "夜间模式最常见的实现是在组件里写一堆 .night 分支，结果样式文件比业务代码还难维护。"
      },
      {
        "type": "heading",
        "text": "令牌方案"
      },
      {
        "type": "paragraph",
        "text": "所有颜色收敛为 CSS 变量，html.night 只覆盖变量表。组件里没有一行暗色判断，切主题就是换一层皮。"
      },
      {
        "type": "quote",
        "text": "判断逻辑收拢到一处，比散落在十个文件里健康一百倍。"
      },
      {
        "type": "heading",
        "text": "两个细节"
      },
      {
        "type": "paragraph",
        "text": "主题偏好存 localStorage 并跟随系统 prefers-color-scheme；切换时给根节点加过渡类，只让参与变色的容器做动画，避免全局 transition 的性能损耗。"
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
        "text": "基建"
      },
      {
        "type": "paragraph",
        "text": "jsdom 不执行 ES module，先用 Vite 打 IIFE 单文件测试包，再在 jsdom 里挂载完整应用逐项断言。"
      },
      {
        "type": "quote",
        "text": "冒烟测试不求覆盖全，只求核心路径永不静默坏死。"
      },
      {
        "type": "heading",
        "text": "踩过的坑"
      },
      {
        "type": "paragraph",
        "text": "固定 sleep 断言会时序抖动，全部换成轮询等待；matchMedia 未实现会中断整个脚本，记得 polyfill。"
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
        "text": "很多博客死于一件事：发一篇文章的流程太痛苦。"
      },
      {
        "type": "heading",
        "text": "设计原则"
      },
      {
        "type": "paragraph",
        "text": "文章就是 articles 目录下的一个 md 文件，frontmatter 声明元信息，构建时自动编译成类型安全的数据。缺字段、slug 重复、日期非法，构建直接报错拦下。"
      },
      {
        "type": "quote",
        "text": "流水线的意义是把「坚持」变成「顺便」。"
      },
      {
        "type": "heading",
        "text": "延伸产物"
      },
      {
        "type": "paragraph",
        "text": "sitemap、RSS、预渲染 HTML 全部从同一份数据派生，新文章一发全部自动更新。"
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
        "text": "线上见过最冤的白屏：某个边角组件抛了个错，整页跟着陪葬。"
      },
      {
        "type": "heading",
        "text": "兜底方案"
      },
      {
        "type": "paragraph",
        "text": "根组件挂 onErrorCaptured，捕获后上报并阻断传播；局部组件各自降级渲染占位。"
      },
      {
        "type": "quote",
        "text": "错误处理的目标不是消灭报错，而是让报错的爆炸半径可控。"
      },
      {
        "type": "heading",
        "text": "配套动作"
      },
      {
        "type": "paragraph",
        "text": "环境探测类 API（matchMedia、IntersectionObserver）全部封装降级版本，不支持的浏览器走兜底分支，绝不中断脚本。"
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
        "text": "令牌化"
      },
      {
        "type": "paragraph",
        "text": "品牌色、表面色、文字色、描边、阴影、圆角、动效曲线全部收敛为 CSS 变量，组件内禁止硬编码。"
      },
      {
        "type": "quote",
        "text": "主题系统正确的打开方式：组件零感知，只换令牌。"
      },
      {
        "type": "heading",
        "text": "效果"
      },
      {
        "type": "paragraph",
        "text": "夜间模式只需在 html.night 里覆盖一份令牌表，所有组件自动适配。新增页面天然继承两套主题，这才是令牌系统的复利。"
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
        "text": "改了什么"
      },
      {
        "type": "paragraph",
        "text": "跳转链接让键盘用户直达正文；交互按钮补齐 aria-label；焦点管理在弹窗和抽屉里做闭环——打开时聚焦输入框，关闭时归还焦点。"
      },
      {
        "type": "quote",
        "text": "无障碍不是慈善，是把「能用的产品」变成「好用的产品」。"
      },
      {
        "type": "heading",
        "text": "顺手修的"
      },
      {
        "type": "paragraph",
        "text": "对比度不足的灰色文字全部加深一档，读屏模式和夜间模式都受益，视觉上反而更精致。"
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
        "text": "真相"
      },
      {
        "type": "paragraph",
        "text": "页面切换用了 out-in 过渡：scrollBehavior 触发时新页面还没挂载，旧页面还占着 DOM。此刻滚动会被旧页面高度截断。"
      },
      {
        "type": "quote",
        "text": "过渡动画和滚动恢复的执行时序冲突，是单页应用的经典暗坑。"
      },
      {
        "type": "heading",
        "text": "解法"
      },
      {
        "type": "paragraph",
        "text": "scrollBehavior 里只记录位置并返回 false，等新页面 enter 钩子触发再真正滚动。另有一个隐藏坑：同组件路由间的返回不会触发过渡，记得在前进导航时清掉残留位置。"
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
        "text": "收益最大的三招"
      },
      {
        "type": "paragraph",
        "text": "第一是路由级代码分割，详情页懒加载后首包直接砍半；第二是把框架依赖和业务代码分包，缓存命中率大幅提升；第三是清掉两个「顺手装」的全量引入。"
      },
      {
        "type": "quote",
        "text": "体积优化的本质是：只加载当前页面需要的东西。"
      },
      {
        "type": "heading",
        "text": "意料之外"
      },
      {
        "type": "paragraph",
        "text": "CSS 代码分割的收益被严重低估了。拆完之后首屏样式体积降了 40%，比砍 JS 还狠。"
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
        "text": "指令设计"
      },
      {
        "type": "paragraph",
        "text": "封装成 v-lazy-bg 指令：挂载时观察元素，进入视口才把真实 URL 写入样式。不支持 IntersectionObserver 的环境直接降级为立即加载。"
      },
      {
        "type": "quote",
        "text": "兜底逻辑的优先级永远高于炫技。"
      },
      {
        "type": "heading",
        "text": "细节"
      },
      {
        "type": "paragraph",
        "text": "卸载时记得 unobserve，不然单页应用切几次路由监听器就堆成山了。这个坑不报错，只会慢慢变卡，很难排查。"
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
        "text": "为什么自己写"
      },
      {
        "type": "paragraph",
        "text": "托管平台很方便，但样式不由自己说了算，总感觉是给别人打工。自己写的博客，每一像素都能讲出理由。"
      },
      {
        "type": "quote",
        "text": "独立博客的价值不在阅读量，在于有一块完全属于自己的地。"
      },
      {
        "type": "heading",
        "text": "技术选型"
      },
      {
        "type": "paragraph",
        "text": "最终定了 Vue 3 + Vite + TypeScript，纯静态输出。数据就是一组 Markdown 文件，构建时编译成类型安全的数据模块。 后续计划：接入评论、加归档页、写一套自动部署。这个坑会慢慢填，文章会慢慢写。"
      }
    ]
  }
]
