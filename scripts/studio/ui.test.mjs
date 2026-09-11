/**
 * Studio 后台界面冒烟测试（jsdom，零服务依赖，不写任何真实数据）
 *
 * 为什么必须存在：page.mjs 的客户端脚本是**字符串拼接**生成的。
 * page.mjs 自身 `node --check` 通过 ≠ 拼出来的产物通过 —— 历史两次白屏
 * 都是这么埋进去的（多处一个括号、反斜杠正则被字符串层吞掉）。
 * 本测试做两件事：
 *   1. 白屏防线：把 page() 产出的 HTML 里的内联脚本抽出来逐块 `node --check`
 *   2. 交互验证：jsdom 真跑一遍（fetch 打桩），断言视图结构与行为
 *
 * 运行：node scripts/studio/ui.test.mjs
 * （不用 npm script 也能跑；npm 被外部环境挡住时这是唯一的验证通道）
 */
import { writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'
import { page } from './page.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const html = page('ui-test-nonce')

let pass = 0
let fail = 0
function check(name, ok, extra) {
  if (ok) {
    pass++
    console.log('  PASS ' + name + (extra ? ' | ' + extra : ''))
  } else {
    fail++
    console.log('  FAIL ' + name + (extra ? ' | ' + extra : ''))
  }
}

/* ---------- 1. 内联脚本逐块语法检查（白屏防线） ---------- */
console.log('\n[1] 内联脚本语法')
const dir = mkdtempSync(join(tmpdir(), 'studio-ui-'))
let blocks = 0
let syntaxBad = 0
let pos = 0
for (;;) {
  const s = html.indexOf('<script', pos)
  if (s < 0) break
  const e = html.indexOf('</script>', s)
  if (e < 0) break
  const oe = html.indexOf('>', s)
  const open = html.slice(s, oe + 1)
  const code = html.slice(oe + 1, e)
  pos = e + 9
  if (/\ssrc=/.test(open) || /application\/json/.test(open)) continue
  blocks++
  const f = join(dir, 'block' + blocks + '.js')
  writeFileSync(f, code)
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
  } catch (err) {
    syntaxBad++
    console.log('  内联脚本块 ' + blocks + ' 语法失败：')
    console.log(String(err.stderr || '').split('\n').slice(0, 8).join('\n'))
  }
}
check('内联脚本块存在', blocks > 0, blocks + ' 块')
check('全部内联脚本语法通过', syntaxBad === 0, syntaxBad + ' 块失败')

/* ---------- 2. 交互验证（jsdom + fetch 打桩） ---------- */
const jSite = {
  ok: true,
  site: {
    site: {
      name: '探针站', fullName: '探针站全名', tagline: 'tag', description: 'desc',
      author: '作者', email: 'a@b.c', icp: 'ICP', about: '关于文案', footerDesc: '页脚文案',
    },
    friendLinks: [{ label: '友链A', href: 'https://a.example' }],
    mainNav: [
      { label: '首页', icon: '🏠', kind: 'route', target: 'home', children: [{ label: '测试页', icon: '', kind: 'route', target: 'dome' }] },
      { label: '归档', icon: '', kind: 'route', target: 'archive' },
    ],
    pagination: { sizes: [5, 10], defaultSize: 5 },
    aboutPage: {
      intro: '介绍',
      techStack: [{ name: 'Vite', role: '构建' }],
      milestones: [{ date: '2026-01', text: '起步' }],
    },
  },
}
const jPages = { ok: true, pages: [{ slug: 'dome', title: '测试页', status: 'published', reachable: true }] }
const jGit = {
  ok: true,
  file: {
    'user.name': 'WillowEcho', 'user.email': 'willowecho@163.com',
    'http.version': 'HTTP/1.1', 'github.username': '769863269',
  },
  live: { 'user.name': 'WillowEcho', 'user.email': 'willowecho@163.com', 'http.version': 'HTTP/1.1' },
  cred: { hasToken: true, username: '769863269' },
}
const jArticle = {
  ok: true,
  article: {
    file: 'probe.md', title: '探针文章', slug: 'probe', excerpt: '', status: 'draft', body: '# 探针',
    publishedAt: '2026-09-01', publishedTime: '', tags: [], keywords: [], category: '', author: '周周',
    pinned: false, featured: false, publishAt: '', offlineAt: '', seoDescription: '', cover: '',
  },
}
const jMeta = {
  ok: true,
  me: { name: '周周', role: 'admin' },
  authors: [{ name: '周周', role: 'admin' }],
  counts: {},
  pending: 0,
  taxonomy: { categories: [], tags: [] },
  featured: { count: 0, max: 5 },
}

const errors = []
const vc = new VirtualConsole()
vc.on('jsdomError', (e) => {
  const m = String(e?.message ?? e)
  if (/not implemented/i.test(m)) return // jsdom 未实现的浏览器 API，不算页面 bug
  errors.push(m)
})
vc.on('error', (...a) => errors.push(a.join(' ')))

const dom = new JSDOM(html, {
  url: 'http://127.0.0.1:5199/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    // jsdom 不实现这几个 API，不打桩会让整个脚本块中断，后面的 IIFE 全不执行
    window.matchMedia = window.matchMedia || function () {
      return { matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }
    }
    window.scrollTo = function () {}
    window.__fetchLog = []
    window.fetch = function (path) {
      const p = String(path)
      window.__fetchLog.push(p)
      let body = { ok: true, articles: [], trash: [], logs: [] }
      if (p.indexOf('/api/meta') === 0) body = jMeta
      else if (p.indexOf('/api/article/') === 0) body = jArticle
      else if (p.indexOf('/api/articles') === 0) body = { ok: true, articles: [], total: 0, totalPages: 1, page: 1 }
      else if (p.indexOf('/api/site') === 0) body = jSite
      else if (p.indexOf('/api/pages') === 0) body = jPages
      else if (p.indexOf('/api/git-config/verify') === 0) body = { ok: true, message: '凭证可用' }
      else if (p.indexOf('/api/git-config') === 0) body = jGit
      else if (p.indexOf('/api/authors') === 0) body = { ok: true, me: { role: 'admin' }, authors: jMeta.authors }
      return Promise.resolve({ json: () => Promise.resolve(body) })
    }
  },
})

await sleep(400)
const { window } = dom
const doc = window.document
const $ = (sel) => doc.querySelector(sel)
const $$ = (sel) => Array.from(doc.querySelectorAll(sel))

console.log('\n[2] 侧栏信息架构')
const navItems = $$('.nav-item')
check('侧栏 8 项（5 个状态筛选已收进页面内的标签页）', navItems.length === 8, '实际 ' + navItems.length)
check('分组标题：内容 / 站点 / 系统',
  $$('.nav-group').map((g) => g.textContent).join('/') === '内容/站点/系统',
  $$('.nav-group').map((g) => g.textContent).join('/'))
check('顺序：文章/自定义页面/分类与标签/回收站/站点设置/系统设置/作者与权限/操作日志',
  navItems.map((a) => a.getAttribute('data-nav')).join(',') === 'list,pages,taxonomy,trash,site,settings,authors,logs',
  navItems.map((a) => a.getAttribute('data-nav')).join(','))
check('身份选择器渲染', !!$('#meSelect'))

console.log('\n[3] 站点设置：标签页分区')
window.location.hash = '#/site'
await sleep(400)
const tabs = $$('.site-tab')
const panels = $$('.site-panel')
const visiblePanels = () => panels.filter((p) => p.style.display !== 'none').map((p) => p.getAttribute('data-panel')).join()
check('标签按钮 4 个', tabs.length === 4, '实际 ' + tabs.length)
check('标签文案齐全', tabs.map((t) => t.textContent).join('/') === '基本信息/文案与友链/关于页/导航菜单',
  tabs.map((t) => t.textContent).join('/'))
check('面板 4 个', panels.length === 4, '实际 ' + panels.length)
check('默认只显示「基本信息」', visiblePanels() === 'basic', visiblePanels())

function clickTab(id) {
  const btn = tabs.find((t) => t.getAttribute('data-tab') === id)
  if (btn) btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}
clickTab('nav')
check('切「导航菜单」只显示 nav', visiblePanels() === 'nav', visiblePanels())
check('导航行与拖拽手柄仍在（父 + 子 + 平级 = 3 行）',
  $$('#navRows .nav-row').length === 3 && $$('#navRows .nv-drag').length === 3,
  $$('#navRows .nav-row').length + ' 行')
console.log('\n[3.5] 导航层级：缩进渲染与升降级')
const navRowsAll = $$('#navRows .nav-row')
const childRow = navRowsAll[1]
const flatRow = navRowsAll[2]
check('子项渲染缩进（data-depth=1，margin-left=26px，级别标记）',
  childRow.dataset.depth === '1' && childRow.style.marginLeft === '26px' &&
    childRow.querySelector('.nv-depth-tag').textContent.indexOf('2级') >= 0,
  'depth=' + childRow.dataset.depth + ' ml=' + childRow.style.marginLeft)
function clickNavBtn(row, cls) {
  row.querySelector(cls).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}
// 首行不能降级
clickNavBtn(navRowsAll[0], '.nv-indent')
check('第一项不能降级', navRowsAll[0].dataset.depth === '0', navRowsAll[0].dataset.depth)
// 上一行深度不够（0 < 1）时子项不能再降
clickNavBtn(childRow, '.nv-indent')
check('上一项层级不够时 ⇥ 被拦', childRow.dataset.depth === '1', childRow.dataset.depth)
// 平级行（归档）可降为首页的第二个子菜单，再升回顶级
clickNavBtn(flatRow, '.nv-indent')
check('⇥ 降为上一项的子菜单（2 级缩进）',
  flatRow.dataset.depth === '1' && flatRow.style.marginLeft === '26px',
  'depth=' + flatRow.dataset.depth)
clickNavBtn(flatRow, '.nv-outdent')
check('⇤ 升回顶级', flatRow.dataset.depth === '0' && flatRow.style.marginLeft === '0px',
  'depth=' + flatRow.dataset.depth)
clickNavBtn(flatRow, '.nv-outdent')
check('顶级再升被拦（提示不越界）', flatRow.dataset.depth === '0', flatRow.dataset.depth)
clickTab('copy')
check('切「文案与友链」只显示 copy', visiblePanels() === 'copy', visiblePanels())
clickTab('about')
check('切「关于页」只显示 about', visiblePanels() === 'about', visiblePanels())
check('关于页三字段到位', !!$('#sAbIntro') && !!$('#sAbStack') && !!$('#sAbMiles'))
clickTab('basic')
check('切回「基本信息」', visiblePanels() === 'basic', visiblePanels())

console.log('\n[4] 站点设置：保存与数据完整性')
check('四个面板各一个保存按钮', $$('.site-save').length === 4, '实际 ' + $$('.site-save').length)
check('旧底部悬浮条已移除', !$('#sSave'))
// 切页只是 display:none，字段必须还在 DOM 里 —— 否则保存会丢别的标签页的改动
clickTab('nav')
const hiddenName = $('#sName')
check('隐藏面板字段仍在 DOM（切页不丢数据）', !!hiddenName && hiddenName.value === '探针站',
  hiddenName ? hiddenName.value : 'missing')
check('友链行不受切换影响', $$('#flRows .fl-label').length === 1)

console.log('\n[5] 文章列表：页头 + 状态标签页')
window.location.hash = '#/list/all'
await sleep(400)
const stabs = $$('.status-tab')
check('状态标签页 5 个', stabs.length === 5, '实际 ' + stabs.length)
check('默认「全部」为激活态',
  !!stabs[0] && stabs[0].classList.contains('active') && stabs[0].textContent.indexOf('全部') === 0,
  stabs[0] ? stabs[0].textContent : 'missing')
check('状态标签页挂在文章路由下',
  stabs[0] && stabs[0].getAttribute('href') === '#/list/all',
  stabs[0] ? String(stabs[0].getAttribute('href')) : 'missing')
check('统一页头渲染出标题', (($('h2') || {}).textContent || '') === '文章', ($('h2') || {}).textContent || '')
check('文章菜单项处于高亮态',
  $$('.nav-item').filter((a) => a.getAttribute('data-nav') === 'list')[0].classList.contains('active'))

console.log('\n[6] 编辑器：进出与离场清理')
window.location.hash = '#/editor/new'
await sleep(450)
check('编辑器渲染（标题输入框在）', !!$('#eTitle'))
// 只匹配 class 属性里的真实用法（页面上可能有提到该词的说明文字，不算）
check('后台已无毛玻璃背景（滚动时每帧重绘的热点）', !/class="[^"]*backdrop-blur/.test(html))
window.location.hash = '#/trash'
await sleep(350)
check('离开后编辑区 DOM 已卸载', !$('#eTitle'))
window.location.hash = '#/editor/new'
await sleep(450)
check('二次进入编辑器正常渲染（无残留实例干扰）', !!$('#eTitle'))
window.location.hash = '#/list/all'
await sleep(250)

console.log('\n[7] 系统设置：Git 配置卡片（异步读取，页面不被阻塞）')
// 背景：/api/git-config 曾经稳定耗时 12~17 秒（7 次同步 git 子进程），
// 把整个后台事件循环按住。现在服务端直读 .git/config（约 1ms），前端也保证
// 页面先渲染、卡片后填充。这组断言锁住"进设置页不会卡住、提示会收尾"的契约。
window.__fetchLog.length = 0
window.location.hash = '#/settings'
await sleep(420)
check('Git 配置卡片渲染', !!$('#gitName') && !!$('#gitEmail') && !!$('#gitHttp') && !!$('#gitUser'))
check('提交身份已回填', ($('#gitName') || {}).value === 'WillowEcho', ($('#gitName') || {}).value)
check('邮箱已回填', ($('#gitEmail') || {}).value === 'willowecho@163.com', ($('#gitEmail') || {}).value)
check('协议已回填', ($('#gitHttp') || {}).value === 'HTTP/1.1', ($('#gitHttp') || {}).value)
check('GitHub 账号名已回填', ($('#gitUser') || {}).value === '769863269', ($('#gitUser') || {}).value)
check('凭证徽标显示「已配置」',
  (($('#gitCredBadge') || {}).textContent || '').indexOf('已配置') >= 0,
  (($('#gitCredBadge') || {}).textContent || '').trim())
check('加载提示已收尾（不残留「正在读取」）',
  (($('#gitMsg') || {}).textContent || '').indexOf('正在读取') < 0,
  ($('#gitMsg') || {}).textContent)
const gitHits = window.__fetchLog.filter((u) => u.indexOf('/api/git-config') === 0).length
check('进设置页只请求一次 git 配置', gitHits === 1, '请求 ' + gitHits + ' 次')

console.log('\n[8] 性能回归：meta 缓存与视图清理契约')
window.__fetchLog.length = 0
for (const h of ['#/trash', '#/taxonomy', '#/authors', '#/logs', '#/list/all']) {
  window.location.hash = h
  await sleep(160)
}
const metaHits = window.__fetchLog.filter((u) => u.indexOf('/api/meta') === 0).length
// 改版前每切一次视图就打一次 /api/meta；现在有 5 秒 TTL 缓存，连切 5 个视图最多补 1 次
check('连切 5 个视图不重复请求 /api/meta', metaHits <= 1, 'meta 请求 ' + metaHits + ' 次')
check('存在视图离场清理钩子 onLeave', html.indexOf('function onLeave(') >= 0)
check('存在统一页头组件 pageHead', html.indexOf('function pageHead(') >= 0)
check('存在状态标签页组件 statusTabs', html.indexOf('function statusTabs(') >= 0)
const pasteBinds = html.split("document.addEventListener('paste'").length - 1
check('document 上只绑一次 paste 监听（防每次进编辑器叠加）', pasteBinds === 1, '实际 ' + pasteBinds + ' 处')

console.log('\n[9] 页面运行时报错')
check('无未捕获报错', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败')
process.exit(fail ? 1 : 0)
