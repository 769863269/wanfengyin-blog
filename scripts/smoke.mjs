/**
 * jsdom 冒烟测试
 *
 * 流程：vite 以 IIFE 单文件打出测试包（vite.config.smoke.ts）→
 * 在 jsdom 里挂载完整应用（Vue + vue-router）→ 逐项断言核心交互。
 *
 * 运行：`npm run smoke`（Node >= 18，无其他外部依赖）
 *
 * 覆盖项：
 *   1. 首页挂载：头部 / 导航 / 文章卡片 / 侧栏 / 页脚
 *   2. 夜间模式：点击切换 class + localStorage 持久化
 *   3. 站内搜索：输入关键词 → 结果过滤 → 点击跳转文章页
 *   4. 路由：文章详情渲染（标题/正文/标签）、404 页
 *   5. 标签筛选与「加载更多」
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const shell = readFileSync(resolve(root, 'dist-smoke/index.html'), 'utf8')
const bundle = readFileSync(resolve(root, 'dist-smoke/smoke-bundle.js'), 'utf8')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 轮询等待条件成立，代替固定 sleep —— 固定延时在 CI 机器上会时序抖动 */
async function waitFor(fn, timeout = 2000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (fn()) return true
    await sleep(25)
  }
  return fn()
}

/** 收集页面 JS 报错，测试结束时统一清算 */
const pageErrors = []
const virtualConsole = new VirtualConsole()
virtualConsole.on('jsdomError', (e) => {
  // jsdom 未实现的 API（如 scrollTo 之外的 CSS 布局告警）不算失败
  const msg = String(e?.message ?? e)
  if (/not implemented/i.test(msg)) return
  pageErrors.push(msg)
})
virtualConsole.on('error', (...a) => pageErrors.push(a.join(' ')))

// 以构建产物 HTML 为壳，去掉 module 引用，注入 polyfill + IIFE 包
const html = shell
  .replace(/<script[^>]*type="module"[^>]*><\/script>/g, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
  .replace(
    '</head>',
    `<script>
      window.scrollTo = function () {}
      /* 打包后的 Vue 运行时依赖 process.env.NODE_ENV */
      window.process = window.process || { env: { NODE_ENV: 'production' } }
    </script></head>`,
  )
  .replace('</body>', `<script>${bundle.replace(/<\/script>/gi, '<\\/script>')}</script></body>`)

const dom = new JSDOM(html, {
  url: 'http://localhost:5173/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole,
})

const { window } = dom
const { document } = window
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
const input = (el, value) => {
  el.value = value
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}

let passed = 0
const failures = []

function check(name, cond, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failures.push(name + (extra ? `（${extra}）` : ''))
    console.log(`  ✗ ${name} ${extra}`)
  }
}

async function main() {
  console.log('\n[1] 首页挂载')
  await sleep(120) // 等微任务/路由首次解析
  check('#app 已挂载内容', ($('#app')?.children.length ?? 0) > 0)
  check('PC 顶栏渲染', !!$('.app-header__bar--pc'))
  check('导航菜单渲染', $$('.nav-menu a').length > 0)
  check('文章卡片渲染', $$('.post-card').length > 0)
  check('页脚渲染', !!$('footer'))
  check(
    '主题按钮存在（PC+移动端）',
    $$('.theme-toggle').length >= 2,
    `实际 ${$$('.theme-toggle').length} 个`,
  )

  console.log('\n[2] 夜间模式')
  const html0 = document.documentElement
  const before = html0.classList.contains('night')
  click($$('.theme-toggle')[0])
  await sleep(50)
  const after = html0.classList.contains('night')
  check('点击切换 night class', before !== after)
  check('localStorage 持久化', window.localStorage.getItem('night') === (after ? '1' : '0'))
  click($$('.theme-toggle')[1])
  await sleep(50)
  check('第二个按钮同步切换', html0.classList.contains('night') === before)

  console.log('\n[3] 站内搜索')
  click($('.app-header__bar--pc [aria-label="打开搜索"]'))
  await sleep(50)
  const modalInput = $('.search-modal__input')
  check('搜索弹窗打开', !!modalInput)
  input(modalInput, $$('.post-card__title')[0].textContent.trim().slice(0, 4))
  await sleep(80)
  check('结果实时过滤', $$('.search-modal__result').length > 0)
  const firstResult = $('.search-modal__result')
  const targetTitle = firstResult.querySelector('.search-modal__result-title').textContent.trim()
  click(firstResult)
  await waitFor(() => window.location.pathname.startsWith('/post/'))
  check(
    '点击结果跳转文章页',
    window.location.pathname.startsWith('/post/'),
    window.location.pathname,
  )
  await waitFor(() => $('.post-detail__title')?.textContent.trim() === targetTitle)
  check('详情标题与结果一致', $('.post-detail__title')?.textContent.trim() === targetTitle)
  check('详情正文渲染', ($('.post-detail')?.textContent ?? '').length > 50)

  console.log('\n[4] 路由')
  window.history.pushState({}, '', '/definitely-not-exist')
  window.dispatchEvent(new window.PopStateEvent('popstate'))
  await sleep(120)
  check('未知路径渲染 404', $('.not-found__code')?.textContent.includes('404'))

  console.log('\n[5] 标签筛选与加载更多')
  click($('.app-header__brand'))
  await sleep(120)
  const tags = $$('.sidebar a, aside a').filter((a) => a.textContent.trim().length > 0)
  check('侧栏标签渲染', tags.length > 0)
  const loadMore = $('.load-more')
  if (loadMore) {
    const n0 = $$('.post-card').length
    click(loadMore)
    await sleep(80)
    check('加载更多追加卡片', $$('.post-card').length > n0, `${n0} -> ${$$('.post-card').length}`)

    // 进度跨路由保留：进入文章详情再返回，加载进度不应被收回
    const expanded = $$('.post-card').length
    click($$('.post-card__link')[0])
    await waitFor(() => window.location.pathname.startsWith('/post/'))
    await waitFor(() => $('.post-detail__title'))
    click($('.post-detail__back'))
    await waitFor(() => window.location.pathname === '/')
    await waitFor(() => $$('.post-card').length === expanded)
    check(
      '返回后加载进度保留',
      $$('.post-card').length === expanded,
      `展开 ${expanded}，返回后 ${$$('.post-card').length}`,
    )
  } else {
    check('无加载更多按钮（文章不足时合法）', $$('.home__end').length > 0)
  }

  console.log('\n[6] 页面 JS 报错')
  check('无未捕获报错', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))

  console.log(`\n结果：${passed} 通过，${failures.length} 失败`)
  if (failures.length) {
    console.log('失败项：')
    for (const f of failures) console.log(' - ' + f)
    process.exit(1)
  }
}

main().finally(() => window.close())
