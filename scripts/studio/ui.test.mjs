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
    mainNav: [{ label: '首页', icon: '🏠', kind: 'route', target: 'home' }],
    pagination: { sizes: [5, 10], defaultSize: 5 },
    aboutPage: {
      intro: '介绍',
      techStack: [{ name: 'Vite', role: '构建' }],
      milestones: [{ date: '2026-01', text: '起步' }],
    },
  },
}
const jPages = { ok: true, pages: [{ slug: 'dome', title: '测试页', status: 'published', reachable: true }] }
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
    window.fetch = function (path) {
      const p = String(path)
      let body = { ok: true, articles: [], trash: [], logs: [] }
      if (p.indexOf('/api/meta') === 0) body = jMeta
      else if (p.indexOf('/api/articles') === 0) body = { ok: true, articles: [], total: 0, totalPages: 1, page: 1 }
      else if (p.indexOf('/api/site') === 0) body = jSite
      else if (p.indexOf('/api/pages') === 0) body = jPages
      return Promise.resolve({ json: () => Promise.resolve(body) })
    }
  },
})

await sleep(400)
const { window } = dom
const doc = window.document
const $ = (sel) => doc.querySelector(sel)
const $$ = (sel) => Array.from(doc.querySelectorAll(sel))

console.log('\n[2] 首页挂载')
check('侧栏导航渲染', $$('.nav-item').length > 0, $$('.nav-item').length + ' 项')
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
check('导航行与拖拽手柄仍在', $$('#navRows .nav-row').length === 1 && $$('#navRows .nv-drag').length === 1)
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

console.log('\n[5] 页面运行时报错')
check('无未捕获报错', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log('\n结果：' + pass + ' 通过，' + fail + ' 失败')
process.exit(fail ? 1 : 0)
