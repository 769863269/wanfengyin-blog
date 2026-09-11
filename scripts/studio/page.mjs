/**
 * Studio CMS 管理界面 —— 单文件 SPA（Tailwind 浏览器构建，hash 路由）
 *
 * 视图：内容列表（按状态）/ 编辑器 / 回收站 / 分类与标签 / 作者与权限 / 操作日志
 * 身份：右上角切换当前作者（存 localStorage），请求带 x-studio-actor 头。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* Vditor 4 工具栏图标 = <use> 引用 SVG 符号表，符号表由其自带的
 * icons/ant.js 注入——但那个加载器走「XHR 拉内容 + 内联 script 执行」，
 * 会被 nonce CSP（script-src 无 unsafe-inline）拦掉导致图标全空。
 * 这里服务端直出符号表（纯 SVG 不受 CSP 限制），并占用 vditorIconScript
 * 这个 id，让 Vditor 检测到已存在后自动跳过自带加载器。 */
let vditorIconSprite = ''
try {
  const antSrc = readFileSync(
    fileURLToPath(new URL('../../node_modules/vditor/dist/js/icons/ant.js', import.meta.url)),
    'utf8',
  )
  const m = antSrc.match(/`([\s\S]+)`/)
  if (m) vditorIconSprite = m[1].replace('<svg ', '<svg id="vditorIconScript" ')
} catch {
  // 读不到就不注入：图标缺失但不影响编辑器功能
}

export function page(nonce) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>晚风吟 · 内容管理</title>
<link rel="stylesheet" href="/studio.css" />
<style>
  body { font-family: -apple-system, "SF Pro Text", "Segoe UI", "Microsoft YaHei", sans-serif; }
  input[type=file]::file-selector-button { border:0; border-radius:980px; padding:6px 16px; margin-right:12px; background:#e8e8ed; color:#1d1d1f; font-size:13px; cursor:pointer; }
  .spin { animation: spin .9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
  .fade-in { animation: fadein .2s ease-out; } @keyframes fadein { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:none; } }
  /* 侧栏导航：样式集中在这里，HTML 只留语义（便于统一改版） */
  .nav-item { display:flex; align-items:center; gap:8px; border-radius:8px; padding:7px 12px; font-size:13.5px; color:#1d1d1f; text-decoration:none; transition: background-color .15s ease, color .15s ease; }
  .nav-item:hover { background:#f5f5f7; }
  .nav-item.active { background:#e8f1fd; color:#0071e3; font-weight:600; }
  .nav-item .nav-count { margin-left:auto; font-size:11.5px; color:#86868b; }
  .nav-item.active .nav-count { color:#0071e3; }
  .nav-group { padding:14px 12px 5px; font-size:11px; font-weight:600; color:#a1a1a6; letter-spacing:.03em; }
  .nav-group:first-child { padding-top:4px; }

  /* 内容区：页头 / 面包屑 / 状态标签页 统一规格 */
  .crumb { font-size:12.5px; color:#86868b; text-decoration:none; }
  .crumb:hover { color:#0071e3; }
  .crumb-sep { margin:0 6px; color:#c7c7cc; }
  .crumb-now { font-size:12.5px; color:#6e6e73; }
  .status-tab { border:0; background:transparent; border-radius:980px; padding:6px 14px; font-size:13px; color:#6e6e73; cursor:pointer; text-decoration:none; transition: background-color .15s ease, color .15s ease; }
  .status-tab:hover { background:#f0f0f2; color:#1d1d1f; }
  .status-tab.active { background:#1d1d1f; color:#fff; font-weight:600; }
  .status-tab .st-n { margin-left:5px; font-size:11.5px; opacity:.7; }
  .status-tab .st-n:empty { display:none; }
  ::-webkit-scrollbar { width:8px; height:8px; } ::-webkit-scrollbar-thumb { background:#d2d2d7; border-radius:4px; }
  /* Vditor 固定尺寸护栏：高度由 JS 配置锁定，宽度永不超容器，内容超长在编辑器内部滚动 */
  #vditorHost .vditor { width:100% !important; max-width:100% !important; }
  #vditorHost .vditor-content { overflow-y:auto; }
  #vditorHost img, #vditorHost table, #vditorHost pre { max-width:100%; }
  #vditorHost table { display:block; overflow-x:auto; }
</style>
</head>
<body class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased">

<div class="flex min-h-screen">
  <!-- 侧边栏 -->
  <aside class="fixed inset-y-0 left-0 z-20 flex w-[228px] flex-col border-r border-black/5 bg-white px-3 py-5">
    <div class="mb-6 flex items-center gap-2.5 px-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#3a8ffe] to-[#0071e3] text-[16px] font-bold text-white shadow-[0_3px_10px_rgba(0,113,227,0.35)]">晚</div>
      <div>
        <div class="text-[15px] font-semibold leading-tight">晚风吟 CMS</div>
        <div class="text-[11px] text-[#86868b]">内容全生命周期管理</div>
      </div>
    </div>

    <nav id="nav" class="flex-1 space-y-0.5 overflow-y-auto">
      <p class="nav-group">内容</p>
      <a href="#/list/all"  data-nav="list"     class="nav-item"><span>📋</span><span>文章</span><span class="nav-count" data-count="all"></span></a>
      <a href="#/pages"     data-nav="pages"    class="nav-item"><span>📄</span><span>自定义页面</span><span class="nav-count" data-count-pages=""></span></a>
      <a href="#/taxonomy"  data-nav="taxonomy" class="nav-item"><span>🏷</span><span>分类与标签</span></a>
      <a href="#/trash"     data-nav="trash"    class="nav-item"><span>🗑</span><span>回收站</span><span class="nav-count" data-count-trash=""></span></a>
      <p class="nav-group">站点</p>
      <a href="#/site"      data-nav="site"     class="nav-item"><span>⚙️</span><span>站点设置</span></a>
      <p class="nav-group">系统</p>
      <a href="#/settings"  data-nav="settings" class="nav-item"><span>🧩</span><span>系统设置</span></a>
      <a href="#/authors"   data-nav="authors"  class="nav-item"><span>👥</span><span>作者与权限</span></a>
      <a href="#/logs"      data-nav="logs"     class="nav-item"><span>📜</span><span>操作日志</span></a>
    </nav>

    <div class="space-y-2 border-t border-[#f0f0f2] pt-3">
      <button id="syncBtn" class="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50">
        <svg id="syncSpin" class="spin hidden h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
        推送上线 <span id="pendingBadge" class="hidden rounded-full bg-white/25 px-1.5 text-[11px]"></span>
      </button>
      <a href="http://127.0.0.1:5173/" target="_blank" class="block rounded-full border border-[#d2d2d7] px-4 py-1.5 text-center text-[13px] font-medium hover:bg-[#f5f5f7]">预览博客 ↗</a>
      <div id="blogSync" class="px-1 text-[11px] text-[#a1a1a6]"></div>
      <div class="flex items-center gap-2 px-1 pt-1">
        <label class="text-[11px] text-[#86868b]">当前身份</label>
        <select id="meSelect" class="flex-1 rounded-lg border border-[#d2d2d7] px-2 py-1.5 text-[12.5px] outline-none focus:border-[#0071e3]"></select>
      </div>
      <div id="meRole" class="px-1 text-[11px] text-[#a1a1a6]"></div>
    </div>
  </aside>

  <!-- 主区 -->
  <main class="ml-[228px] min-w-0 flex-1 px-8 py-7">
    <div id="view" class="w-full min-w-0"></div>
  </main>
</div>

<!-- 推送任务浮层 -->
<div id="syncPanel" class="fade-in fixed bottom-5 right-5 z-40 hidden w-[420px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
  <div class="mb-2 flex items-center justify-between">
    <span class="text-[13px] font-semibold">推送进度</span>
    <button id="syncPanelClose" class="text-xs text-[#86868b] hover:text-[#1d1d1f]">关闭</button>
  </div>
  <pre id="syncLog" class="max-h-[200px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#1d1d1f] p-3 font-mono text-[11.5px] leading-relaxed text-[#7ee29a]"></pre>
  <div id="syncBanner" class="mt-2.5 hidden rounded-lg px-3 py-2 text-[12.5px]"></div>
</div>

<!-- 确认对话框 -->
<div id="modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/40">
  <div class="w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
    <p id="modalText" class="text-[15px] font-medium"></p>
    <p id="modalSub" class="mt-1.5 text-[13px] text-[#86868b]"></p>
    <div class="mt-5 flex justify-end gap-2.5">
      <button id="modalCancel" class="rounded-full border border-[#d2d2d7] px-5 py-2 text-[13.5px] font-medium hover:bg-[#f5f5f7]">取消</button>
      <button id="modalOk" class="rounded-full bg-[#0071e3] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0077ed]">确定</button>
    </div>
  </div>
</div>

<div id="toast" class="pointer-events-none fixed left-1/2 top-6 z-50 hidden -translate-x-1/2 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] text-white shadow-lg"></div>

${vditorIconSprite}
<script nonce="${nonce || 'noncerequired'}">
/* ================= 基础设施 ================= */
var $ = function (id) { return document.getElementById(id) }
var view = $('view')
var me = localStorage.getItem('wf-actor') || '周周'

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function api(path, opts) {
  opts = opts || {}
  var method = String(opts.method || 'GET').toUpperCase()
  opts.headers = Object.assign({ 'x-studio-actor': encodeURIComponent(me) }, opts.headers || {})
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(opts.body)
  }
  return fetch(path, opts).then(function (r) { return r.json() })
    .then(function (d) {
      if (!d.ok) throw new Error(d.output || '操作失败')
      // 任何写操作都让 meta 缓存失效：免去在每个调用点手工记得刷新，
      // 漏一处就会出现「删了文章但侧栏计数不变」这类缓存不一致
      if (method !== 'GET') invalidateMeta()
      return d
    })
}

var toastTimer = null
function toast(msg, bad) {
  var t = $('toast')
  t.textContent = msg
  t.classList.remove('hidden')
  t.style.background = bad ? '#c0392b' : '#1d1d1f'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(function () { t.classList.add('hidden') }, 2600)
}

var modalCb = null
function confirmBox(text, sub, cb) {
  $('modalText').textContent = text
  $('modalSub').textContent = sub || ''
  modalCb = cb
  $('modal').classList.remove('hidden')
  $('modal').classList.add('flex')
}
$('modalCancel').onclick = function () { $('modal').classList.add('hidden'); $('modal').classList.remove('flex'); modalCb = null }
$('modalOk').onclick = function () {
  $('modal').classList.add('hidden'); $('modal').classList.remove('flex')
  if (modalCb) modalCb()
  modalCb = null
}

var STATUS_STYLE = {
  draft:     'bg-[#f0f0f2] text-[#6e6e73]',
  review:    'bg-[#fff4e0] text-[#b25e02]',
  published: 'bg-[#e8f6ec] text-[#1d7a35]',
  offline:   'bg-[#fdecec] text-[#c0392b]',
}
var STATUS_LABEL = { draft: '草稿', review: '审核中', published: '已发布', offline: '已下线' }
var ROLE_LABEL = { admin: '管理员', editor: '编辑', author: '作者', guest: '访客(只读)' }
var myRole = 'guest'
var BLOG_URL = 'http://' + location.hostname + ':5173'

/* ---- 内容区通用件：各视图共用一套页头与状态标签页，避免每处手写导致样式漂移 ---- */

/** 统一页头：面包屑 + 标题 + 说明 + 右侧主操作。
 *  o = { title, desc, actions, crumbs: [{ label, href }] }；crumbs 最后一项为当前页（无链接）。 */
function pageHead(o) {
  o = o || {}
  var crumbs = ''
  var list = o.crumbs || []
  if (list.length) {
    crumbs = '<nav class="mb-2 flex flex-wrap items-center">' + list.map(function (c, i) {
      if (i === list.length - 1 || !c.href) return '<span class="crumb-now">' + esc(c.label) + '</span>'
      return '<a class="crumb" href="' + esc(c.href) + '">' + esc(c.label) + '</a><span class="crumb-sep">/</span>'
    }).join('') + '</nav>'
  }
  return '<div class="mb-5">' + crumbs +
    '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<div class="min-w-0">' +
        '<h2 class="text-[22px] font-semibold tracking-tight">' + esc(o.title || '') + '</h2>' +
        (o.desc ? '<p class="mt-0.5 max-w-4xl text-[13px] leading-relaxed text-[#86868b]">' + esc(o.desc) + '</p>' : '') +
      '</div>' +
      (o.actions ? '<div class="flex shrink-0 flex-wrap items-center gap-2">' + o.actions + '</div>' : '') +
    '</div>' +
  '</div>'
}

/** 统一主操作按钮（写新文章 / 新建页面等） */
function primaryBtn(href, label) {
  return '<a href="' + href + '" class="rounded-full bg-[#0071e3] px-5 py-2 text-[13.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)] hover:bg-[#0077ed]">' + label + '</a>'
}

/** 统一空状态行（表格 tbody 内） */
function emptyRow(colspan, text) {
  return '<tr><td colspan="' + colspan + '" class="px-5 py-14 text-center text-sm text-[#a1a1a6]">' + text + '</td></tr>'
}

/* 文章状态标签页：侧栏不再为 5 个状态各占一行，改为列表页内切换。
 * 计数用 data-count 让 applyMeta 一起填，数字为空时由 CSS 隐藏。 */
var LIST_STATUSES = [['all', '全部'], ['published', '已发布'], ['draft', '草稿'], ['review', '审核中'], ['offline', '已下线']]
function statusTabs(active) {
  return '<div class="mb-4 flex flex-wrap items-center gap-1 rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
    LIST_STATUSES.map(function (s) {
      return '<a class="status-tab' + (s[0] === active ? ' active' : '') + '" href="#/list/' + s[0] + '">' + s[1] +
        '<span class="st-n" data-count="' + s[0] + '"></span></a>'
    }).join('') + '</div>'
}

/* ================= 元信息 ================= */
/* meta 是侧栏计数、列表筛选、作者名单的共同来源，几乎每个视图都要用。
 * 加 5 秒 TTL 缓存：连续切菜单不再重复打接口（原先每切一次视图就请求一次，
 * 是切换时"顿一下"的一环）；同时 TTL 又不至于让「博客同步中」这类状态卡在旧值上。
 * 数据被写操作改变时，调用方用 loadMeta(true) 强制刷新。 */
var metaCache = null, metaCacheAt = 0
var META_TTL = 5000

function applyMeta(d) {
  myRole = d.me.role
  $('meRole').textContent = '角色：' + (ROLE_LABEL[myRole] || myRole) + (myRole === 'guest' ? '（切换为名单内身份才能操作）' : '')
  var sel = $('meSelect')
  if (sel.options.length === 0) {
    d.authors.forEach(function (a) {
      var o = document.createElement('option')
      o.value = a.name; o.textContent = a.name + ' · ' + ROLE_LABEL[a.role]
      sel.appendChild(o)
    })
    sel.value = d.authors.some(function (a) { return a.name === me }) ? me : (d.authors[0] ? d.authors[0].name : '')
    me = sel.value
    localStorage.setItem('wf-actor', me)
  }
  Object.keys(d.counts).forEach(function (k) {
    // 侧栏徽标与列表内的状态标签页共用同一批计数，这里必须填全部匹配项
    document.querySelectorAll('[data-count="' + k + '"]').forEach(function (el) {
      el.textContent = d.counts[k] || ''
    })
  })
  var badge = $('pendingBadge')
  if (d.pending > 0) { badge.textContent = d.pending; badge.classList.remove('hidden') }
  else badge.classList.add('hidden')
  var bs = $('blogSync')
  if (bs && d.blog) {
    if (d.blog.building) {
      bs.innerHTML = '<span class="text-[#b25e02]">● 博客同步中…</span>'
    } else if (d.blog.lastError) {
      bs.innerHTML = '<span class="text-[#c0392b]" title="' + esc(d.blog.lastError) + '">● 博客同步失败</span>'
    } else if (d.blog.builtAt) {
      bs.textContent = '● 博客已同步 ' + d.blog.builtAt.slice(11, 16)
    } else {
      bs.textContent = '● 博客待同步'
    }
  }
  return d
}

function loadMeta(force) {
  var now = Date.now()
  if (!metaCache || force || now - metaCacheAt > META_TTL) {
    metaCacheAt = now
    metaCache = api('/api/meta').catch(function (e) { metaCache = null; metaCacheAt = 0; throw e })
  }
  return metaCache.then(applyMeta)
}

function invalidateMeta() { metaCache = null; metaCacheAt = 0 }

$('meSelect').addEventListener('change', function () {
  me = $('meSelect').value
  localStorage.setItem('wf-actor', me)
  location.reload()
})

/* ================= 推送上线（流式任务） ================= */
var syncTimer = null
$('syncBtn').addEventListener('click', function () {
  if (myRole === 'author' || myRole === 'guest') return toast('当前身份无权推送', true)
  confirmBox('推送到 GitHub 并触发 Vercel 上线？', '工作区所有变更（文章/图片/改名）会一起提交', function () {
    $('syncPanel').classList.remove('hidden')
    $('syncBanner').classList.add('hidden')
    $('syncLog').classList.remove('text-[#ffb0b0]')
    $('syncLog').classList.add('text-[#7ee29a]')
    $('syncLog').textContent = '正在启动推送任务…'
    $('syncBtn').disabled = true
    $('syncSpin').classList.remove('hidden')
    api('/api/sync', { method: 'POST', body: {} }).then(function (d) {
      pollSync(d.jobId)
    }).catch(function (e) { syncFail(e.message) })
  })
})

function pollSync(jobId) {
  var last = 0
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = setInterval(function () {
    api('/api/jobs/' + jobId).then(function (job) {
      if (job.lines.length > last) {
        $('syncLog').textContent += (last ? '\\n' : '') + job.lines.slice(last).join('\\n')
        $('syncLog').scrollTop = $('syncLog').scrollHeight
        last = job.lines.length
      }
      if (job.status !== 'running') {
        clearInterval(syncTimer); syncTimer = null
        $('syncBtn').disabled = false
        $('syncSpin').classList.add('hidden')
        var b = $('syncBanner')
        b.classList.remove('hidden')
        if (job.status === 'success') {
          b.className = 'mt-2.5 rounded-lg bg-[#e8f6ec] px-3 py-2 text-[12.5px] text-[#1d7a35]'
          b.textContent = '✅ 推送成功，Vercel 约 1~2 分钟后上线'
          loadMeta()
        } else {
          b.className = 'mt-2.5 rounded-lg bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#c0392b]'
          b.textContent = '❌ 推送失败，见上方日志（网络抖动可重试）'
        }
      }
    }).catch(function () {})
  }, 700)
}
function syncFail(msg) {
  $('syncBtn').disabled = false
  $('syncSpin').classList.add('hidden')
  $('syncLog').classList.remove('text-[#7ee29a]')
  $('syncLog').classList.add('text-[#ffb0b0]')
  $('syncLog').textContent = msg
}

/* ================= 路由 ================= */
var routes = {}
var viewSeq = 0 // 视图代数：路由切换 +1，异步回调凭票操作 DOM，防止旧视图回填新视图
var viewCleanup = null // 视图离场清理钩子（销毁编辑器实例 / 清定时器 / 摘全局监听）

function onRoute(pattern, fn) { routes[pattern] = fn }
function onLeave(fn) { viewCleanup = fn }

// 视图级粘贴钩子（编辑器封面用）：document 上只保留这一个监听，
// 由当前视图决定要不要接管，避免每次进编辑器都往 document 叠一层。
var viewPasteHook = null
document.addEventListener('paste', function (e) { if (viewPasteHook) viewPasteHook(e) })

// 侧栏高亮归属：list/* 与 editor/* 都算「文章」，pages/edit/x 算「自定义页面」
function navKeyOf(hash) {
  if (hash.indexOf('list/') === 0 || hash.indexOf('editor/') === 0) return 'list'
  if (hash.indexOf('pages') === 0) return 'pages'
  return hash
}

function navigate() {
  var hash = location.hash.replace(/^#\\//, '') || 'list/all'
  var navKey = navKeyOf(hash)
  document.querySelectorAll('.nav-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.nav === navKey)
  })
  var matched = null, arg = ''
  for (var key in routes) {
    if (hash === key) { matched = routes[key]; break }
    if (key.endsWith('/*') && hash.indexOf(key.slice(0, -2)) === 0) {
      matched = routes[key]; arg = hash.slice(key.length - 1); break
    }
  }
  // 先清理上一视图再挂新视图：编辑器不销毁 Vditor 的话，进出几次就累积
  // 出一堆实例与全局监听（切换时的卡顿主要来自这里）
  if (viewCleanup) {
    try { viewCleanup() } catch (e) { /* 清理失败不能挡住导航 */ }
    viewCleanup = null
  }
  viewSeq++
  view.className = 'w-full' // 全视图统一：内容区占满主区，不留空白
  if (matched) matched(arg)
  else view.innerHTML = '<p class="text-sm text-[#86868b]">页面不存在</p>'
}
$('syncPanelClose').addEventListener('click', function () { $('syncPanel').classList.add('hidden') })
window.addEventListener('hashchange', navigate)

/* ================= 视图：文章列表 ================= */
var listState = { q: '', category: '', tag: '', sort: '', selected: new Set(), page: 1, pageSize: 0, rows: [] }
var pageSizes = [5, 10, 20, 50] // 档位以后台「系统设置」为准，meta 加载后覆盖

onRoute('list/*', function (status) {
  status = status || 'all'
  var seq = viewSeq
  view.innerHTML =
    pageHead({
      title: '文章',
      desc: '状态、置顶、推荐、分类、SEO、定时上下线，全在这里',
      actions: primaryBtn('#/editor/new', '＋ 写新文章'),
    }) +
    statusTabs(status) +
    '<div class="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-black/5 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
      '<input id="fq" placeholder="搜索标题 / 摘要 / 标签 / 关键词…" class="min-w-[220px] flex-1 rounded-lg border border-[#d2d2d7] px-3 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" value="' + esc(listState.q) + '" />' +
      '<select id="fcat" class="rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"><option value="">全部分类</option></select>' +
      '<select id="ftag" class="rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"><option value="">全部标签</option></select>' +
      '<select id="fsort" class="rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]">' +
        '<option value="">最新优先</option><option value="oldest">最早优先</option></select>' +
    '</div>' +
    '<div id="batchBar" class="mb-3 hidden flex-wrap items-center gap-2 rounded-xl bg-[#e8f1fd] px-4 py-2.5 text-[13px] text-[#0b62c4]"></div>' +
    '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
      '<div class="overflow-x-auto"><table class="w-full text-left text-[13.5px]"><thead id="thead" class="bg-[#fafafa] text-[12px] text-[#86868b]"></thead><tbody id="tbody"></tbody></table></div>' +
      '<div id="pageBar" class="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#f0f0f2] px-6 py-4 text-[13px] text-[#6e6e73]"></div>' +
    '</div>'

  loadMeta().then(function (meta) {
    if (seq !== viewSeq) return // 视图已切换，丢弃过期回调
    // 分页档位以后台配置为准；当前条数不在档位内（配置被改小）则回默认档
    if (meta.pagination) {
      pageSizes = meta.pagination.sizes
      if (!pageSizes.includes(listState.pageSize)) listState.pageSize = meta.pagination.defaultSize
      renderRows(status) // 首次渲染可能先于 meta，用配置档位重刷翻页条
    }
    var fill = function (sel, list) {
      list.forEach(function (t) {
        var o = document.createElement('option')
        o.value = t.name || t; o.textContent = (t.name || t) + (t.count ? ' (' + t.count + ')' : '')
        $(sel).appendChild(o)
      })
      $(sel).value = sel === 'fcat' ? listState.category : listState.tag
    }
    fill('fcat', meta.taxonomy.categories)
    fill('ftag', meta.taxonomy.tags)
    $('fsort').value = listState.sort
  })

  var timer = null
  $('fq').addEventListener('input', function () {
    listState.q = $('fq').value
    listState.page = 1 // 筛选变化回第一页
    clearTimeout(timer)
    timer = setTimeout(function () { renderRows(status) }, 300)
  })
  ;['fcat', 'ftag', 'fsort'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      listState.category = $('fcat').value
      listState.tag = $('ftag').value
      listState.sort = $('fsort').value
      listState.page = 1 // 筛选变化回第一页
      renderRows(status)
    })
  })
  renderRows(status)
})

function statusFilterOf(hashStatus) { return hashStatus === 'all' ? '' : hashStatus }

function renderRows(status) {
  var seq = viewSeq
  var params = new URLSearchParams()
  var st = statusFilterOf(status)
  if (st) params.set('status', st)
  if (listState.q) params.set('q', listState.q)
  if (listState.category) params.set('category', listState.category)
  if (listState.tag) params.set('tag', listState.tag)
  if (listState.sort) params.set('sort', listState.sort)
  params.set('page', listState.page)
  params.set('pageSize', listState.pageSize)

  api('/api/articles?' + params.toString()).then(function (d) {
    if (seq !== viewSeq) return // 视图已切换，丢弃过期回调
    var arts = d.articles
    // 删数据后当前页可能越界，收敛到最后一页重取
    if (d.totalPages && listState.page > d.totalPages) {
      listState.page = d.totalPages
      return renderRows(status)
    }
    renderPageBar(d.total || 0, d.totalPages || 1, d.page || 1, status)
    $('thead').innerHTML = '<tr>' +
      '<th class="w-10 px-4 py-2.5"><input type="checkbox" id="checkAll" class="accent-[#0071e3]" /></th>' +
      '<th class="px-3 py-2.5">标题</th><th class="hidden px-3 py-2.5 md:table-cell">作者</th>' +
      '<th class="hidden px-3 py-2.5 lg:table-cell">分类 / 标签</th>' +
      '<th class="hidden px-3 py-2.5 sm:table-cell">日期</th><th class="px-3 py-2.5">状态</th>' +
      '<th class="px-4 py-2.5 text-right">操作</th></tr>'

    if (!arts.length) {
      listState.rows = []
      $('tbody').innerHTML = emptyRow(7, '这里空空如也')
      updateBatchBar()
      return
    }

    $('tbody').innerHTML = arts.map(function (a) {
      var canEdit = myRole === 'admin' || myRole === 'editor' || (myRole === 'author' && a.author === me)
      var ops = '<div class="flex justify-end gap-1.5">' +
        '<a href="#/editor/' + encodeURIComponent(a.file) + '" class="rounded-full border border-[#d2d2d7] px-3 py-1 text-[12px] hover:bg-[#f5f5f7]">编辑</a>'
      if (a.status === 'published') {
        ops += '<a href="' + BLOG_URL + '/post/' + encodeURIComponent(a.slug) + '" target="_blank" title="在博客中查看" class="rounded-full border border-[#d2d2d7] px-3 py-1 text-[12px] hover:bg-[#f5f5f7]">查看</a>'
      }
      if (myRole === 'admin' || myRole === 'editor') {
        ops += flagBtn(a, 'pinned', '📌', '置顶') + flagBtn(a, 'featured', '⭐', '推荐')
        if (a.status === 'published') ops += '<button data-act="offline" data-file="' + esc(a.file) + '" class="rounded-full border border-[#d2d2d7] px-3 py-1 text-[12px] hover:bg-[#f5f5f7]">下线</button>'
        if (a.status !== 'published') ops += '<button data-act="published" data-file="' + esc(a.file) + '" class="rounded-full border border-[#0071e3] px-3 py-1 text-[12px] text-[#0071e3] hover:bg-[#e8f1fd]">发布</button>'
        ops += '<button data-act="delete" data-file="' + esc(a.file) + '" class="rounded-full border border-[#f0d0d0] px-3 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdecec]">删除</button>'
      } else if (canEdit && a.status === 'draft') {
        ops += '<button data-act="review" data-file="' + esc(a.file) + '" class="rounded-full border border-[#0071e3] px-3 py-1 text-[12px] text-[#0071e3] hover:bg-[#e8f1fd]">提交审核</button>'
      }
      ops += '</div>'
      return '<tr class="border-t border-[#f0f0f2] hover:bg-[#fafafa]">' +
        '<td class="px-4 py-3"><input type="checkbox" data-check="' + esc(a.file) + '" class="row-check accent-[#0071e3]" ' + (listState.selected.has(a.file) ? 'checked' : '') + ' /></td>' +
        '<td class="max-w-[320px] px-3 py-3 lg:max-w-[520px] 2xl:max-w-[760px]"><div class="flex items-center gap-1.5">' +
          (a.pinned ? '<span title="置顶">📌</span>' : '') + (a.featured ? '<span title="推荐">⭐</span>' : '') +
          '<span class="truncate font-medium">' + esc(a.title) + '</span>' +
          (a.publishAt && a.status !== 'published' ? '<span title="定时发布 ' + esc(a.publishAt) + '" class="shrink-0 text-[11px]">⏰</span>' : '') +
          (a.offlineAt && a.status === 'published' ? '<span title="定时下线 ' + esc(a.offlineAt) + '" class="shrink-0 text-[11px]">⏳</span>' : '') +
        '</div><div class="mt-0.5 truncate text-[11.5px] text-[#a1a1a6]">' + esc(a.slug) + '</div></td>' +
        '<td class="hidden px-3 py-3 text-[#6e6e73] md:table-cell">' + esc(a.author || '—') + '</td>' +
        '<td class="hidden px-3 py-3 lg:table-cell"><div class="flex flex-wrap gap-1">' +
          (a.category ? '<span class="rounded-full bg-[#e8f1fd] px-2 py-0.5 text-[11px] text-[#0b62c4]">' + esc(a.category) + '</span>' : '') +
          a.tags.slice(0, 3).map(function (t) { return '<span class="rounded-full bg-[#f0f0f2] px-2 py-0.5 text-[11px] text-[#6e6e73]">' + esc(t) + '</span>' }).join('') +
        '</div></td>' +
        '<td class="hidden whitespace-nowrap px-3 py-3 text-[#86868b] sm:table-cell">' + esc(a.publishedAt + (a.publishedTime ? ' ' + a.publishedTime : '')) + '</td>' +
        '<td class="px-3 py-3"><span class="whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ' + STATUS_STYLE[a.status] + '">' + STATUS_LABEL[a.status] + '</span></td>' +
        '<td class="px-4 py-3">' + ops + '</td></tr>'
    }).join('')

    listState.rows = arts
    // 表格事件委托：整表只绑一次（dataset 打标记防重复）。
    // 原先每行 2~5 个按钮各自 addEventListener，而且 renderRows 每次重跑（筛选/翻页）
    // 都会再绑一轮，监听器只增不减 —— 这也是切换时顿一下的来源之一。
    var tb = $('tbody')
    if (!tb.dataset.wired) {
      tb.dataset.wired = '1'
      tb.addEventListener('click', function (e) {
        var flagBtn = e.target.closest('[data-flag]')
        if (flagBtn) {
          var f = flagBtn.dataset.flag
          var patch = {}; patch[f] = flagBtn.dataset.on !== 'true'
          api('/api/article/' + encodeURIComponent(flagBtn.dataset.file) + '/flags', { method: 'POST', body: patch })
            .then(function () { toast(f === 'pinned' ? '置顶已更新' : '推荐已更新'); loadMeta(true); renderRows(status) })
            .catch(function (e2) { toast(e2.message, true) })
          return
        }
        var actBtn = e.target.closest('[data-act]')
        if (actBtn) rowAction(actBtn.dataset.act, actBtn.dataset.file)
      })
      tb.addEventListener('change', function (e) {
        var c = e.target.closest('.row-check')
        if (!c) return
        if (c.checked) listState.selected.add(c.dataset.check)
        else listState.selected.delete(c.dataset.check)
        updateBatchBar()
      })
    }
    var thead = $('thead')
    if (!thead.dataset.wired) {
      thead.dataset.wired = '1'
      thead.addEventListener('change', function (e) {
        if (!e.target.closest('#checkAll')) return
        var on = e.target.checked
        ;(listState.rows || []).forEach(function (a) {
          if (on) listState.selected.add(a.file); else listState.selected.delete(a.file)
        })
        document.querySelectorAll('.row-check').forEach(function (c) { c.checked = on })
        updateBatchBar()
      })
    }
    updateBatchBar()
  })
}

/* ---- 翻页条：每页条数 / 首页 上一页 下一页 尾页 / 指定页跳转 ---- */
function pageBtn(id, label, enabled) {
  var base = 'rounded-full border px-5 py-2 text-[13px] leading-none transition-all '
  return enabled
    ? '<button id="' + id + '" class="' + base + 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0071e3]">' + label + '</button>'
    : '<button id="' + id + '" disabled class="' + base + 'border-[#e8e8ed] bg-transparent text-[#c7c7cc] cursor-not-allowed">' + label + '</button>'
}

function renderPageBar(total, totalPages, page, status) {
  var bar = $('pageBar')
  if (!bar) return
  if (!total) { bar.innerHTML = '<span class="py-1 text-[13px]">共 0 篇</span>'; return }
  var sizeSel = '<select id="pSize" class="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] leading-none outline-none transition-colors hover:border-[#0071e3] focus:border-[#0071e3]">' +
    pageSizes.map(function (n) {
      return '<option value="' + n + '"' + (n === listState.pageSize ? ' selected' : '') + '>' + n + ' 条/页</option>'
    }).join('') +
    '</select>'
  bar.innerHTML =
    '<span class="flex items-center text-[13.5px]" style="margin-right:24px">共&nbsp;<b style="margin:0 5px;font-weight:600;color:#1d1d1f">' + total + '</b>篇<span style="margin:0 14px;color:#c7c7cc">·</span>第&nbsp;<b style="margin:0 5px;font-weight:600;color:#1d1d1f">' + page + '</b>&nbsp;/&nbsp;' + totalPages + '&nbsp;页</span>' +
    '<span class="flex items-center">' + sizeSel + '</span>' +
    '<span class="ml-auto flex flex-wrap items-center gap-2.5">' +
      pageBtn('pFirst', '首页', page > 1) +
      pageBtn('pPrev', '上一页', page > 1) +
      pageBtn('pNext', '下一页', page < totalPages) +
      pageBtn('pLast', '尾页', page < totalPages) +
      '<span class="ml-3 flex items-center gap-2 text-[13px] text-[#6e6e73]">跳至' +
        '<input id="pJump" type="number" min="1" max="' + totalPages + '" value="' + page + '" class="w-16 rounded-full border border-[#d2d2d7] bg-white px-3 py-2 text-center text-[13px] leading-none outline-none transition-colors focus:border-[#0071e3]" />页' +
        '<button id="pGo" class="rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-medium leading-none text-white transition-all hover:bg-[#0077ed] active:scale-[0.97]">跳转</button>' +
      '</span>' +
    '</span>'

  var go = function (p) {
    listState.page = Math.min(Math.max(p, 1), totalPages)
    renderRows(status)
  }
  $('pSize').addEventListener('change', function () {
    listState.pageSize = Number($('pSize').value)
    listState.page = 1 // 条数变化回第一页
    renderRows(status)
  })
  ;['pFirst', 'pPrev', 'pNext', 'pLast'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      if (id === 'pFirst') go(1)
      else if (id === 'pPrev') go(listState.page - 1)
      else if (id === 'pNext') go(listState.page + 1)
      else go(totalPages)
    })
  })
  var jump = function () {
    var v = Number.parseInt($('pJump').value, 10)
    if (Number.isNaN(v)) return
    go(v)
  }
  $('pGo').addEventListener('click', jump)
  $('pJump').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); jump() }
  })
}

function flagBtn(a, key, icon, label) {
  var on = a[key]
  return '<button data-flag="' + key + '" data-on="' + on + '" data-file="' + esc(a.file) + '" title="' + label + '" class="rounded-full border px-2.5 py-1 text-[12px] ' +
    (on ? 'border-[#f5c542] bg-[#fff8e0]' : 'border-[#d2d2d7] hover:bg-[#f5f5f7]') + '">' + icon + '</button>'
}

function rowAction(act, file) {
  if (act === 'delete') {
    confirmBox('删除「' + file + '」？', '会移入回收站，可随时恢复', function () {
      api('/api/article/' + encodeURIComponent(file), { method: 'DELETE' })
        .then(function () { toast('已移入回收站'); loadMeta(); navigate() })
        .catch(function (e) { toast(e.message, true) })
    })
    return
  }
  var labels = { published: '发布', offline: '下线', review: '提交审核', draft: '转为草稿' }
  api('/api/article/' + encodeURIComponent(file) + '/status', { method: 'POST', body: { to: act } })
    .then(function () { toast(labels[act] + '成功'); loadMeta(); navigate() })
    .catch(function (e) { toast(e.message, true) })
}

function updateBatchBar() {
  var bar = $('batchBar')
  if (!bar) return
  var n = listState.selected.size
  if (!n) { bar.classList.add('hidden'); return }
  bar.classList.remove('hidden')
  var btn = function (act, label, cls) {
    return '<button data-batch="' + act + '" class="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ' + (cls || 'bg-white text-[#0b62c4] border border-[#bcd8f7] hover:bg-[#f0f7ff]') + '">' + label + '</button>'
  }
  var isAdmin = myRole === 'admin' || myRole === 'editor'
  bar.innerHTML = '<span class="font-semibold">已选 ' + n + ' 篇：</span>' +
    (isAdmin ? btn('published', '批量发布') + btn('offline', '批量下线') + btn('draft', '转为草稿') : '') +
    (isAdmin ? btn('delete', '批量删除', 'bg-white text-[#c0392b] border border-[#f0d0d0] hover:bg-[#fdecec]') : '') +
    '<button data-batch="clear" class="ml-auto text-[12px] text-[#86868b] hover:text-[#1d1d1f]">取消选择</button>'

  bar.querySelectorAll('[data-batch]').forEach(function (b) {
    b.addEventListener('click', function () {
      var act = b.dataset.batch
      if (act === 'clear') { listState.selected.clear(); navigate(); return }
      var files = Array.from(listState.selected)
      if (act === 'delete') {
        confirmBox('批量删除 ' + files.length + ' 篇？', '移入回收站，可恢复', function () { doBatch(act, files, '') })
      } else {
        doBatch(act, files, '')
      }
    })
  })
}

function doBatch(action, files, value) {
  api('/api/batch', { method: 'POST', body: { files: files, action: action, value: value } })
    .then(function (d) {
      var msg = '完成 ' + d.done.length + ' 篇' + (d.failed.length ? '，失败 ' + d.failed.length + ' 篇：' + d.failed[0].reason : '')
      toast(msg, d.failed.length > 0)
      listState.selected.clear()
      loadMeta(); navigate()
    })
    .catch(function (e) { toast(e.message, true) })
}

/* ================= 视图：编辑器 ================= */
onRoute('editor/*', function (file) {
  var isNew = file === 'new'
  var load = isNew ? Promise.resolve({ article: blankArticle() })
    : api('/api/article/' + encodeURIComponent(file))

  load.then(function (d) {
    var a = d.article
    var canEdit = myRole === 'admin' || myRole === 'editor' || (myRole === 'author' && a.author === me && (isNew || a.status === 'draft'))
    var mdBar = '' // Vditor 自带工具栏，手搓版已退役（保留变量名防旧引用报错）

    view.innerHTML =
      '<div id="eDraftBar" class="mb-4 hidden flex-wrap items-center gap-3 rounded-xl border border-[#f0d78c] bg-[#fdf6ec] px-4 py-2.5 text-[13px] text-[#8a6d1a]">' +
        '<span id="eDraftInfo"></span>' +
        '<div class="ml-auto flex gap-2">' +
          '<button id="eDraftRestore" class="rounded-full bg-[#1d1d1f] px-3.5 py-1 text-[12px] font-medium text-white">恢复草稿</button>' +
          '<button id="eDraftDrop" class="rounded-full border border-[#d2d2d7] px-3.5 py-1 text-[12px] hover:bg-white">丢弃</button>' +
        '</div>' +
      '</div>' +
      pageHead({
        crumbs: [{ label: '文章', href: '#/list/all' }, { label: isNew ? '写新文章' : esc(a.title || '无标题') }],
        title: isNew ? '写新文章' : '编辑文章',
        actions: (isNew ? '' : '<span class="rounded-full px-2.5 py-1 text-[11.5px] font-medium ' + STATUS_STYLE[a.status] + '">' + STATUS_LABEL[a.status] + '</span>') +
          (a.status === 'published' ? '<a id="eViewBlog" href="' + BLOG_URL + '/post/' + encodeURIComponent(a.slug) + '" target="_blank" class="text-[12.5px] text-[#0071e3] hover:underline">在博客预览 ↗</a>' : ''),
      }) +

      '<div class="space-y-5">' +
        '<div class="space-y-5">' +
          '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-3 text-[13px] font-semibold text-[#6e6e73]">封面图</p>' +
            '<input type="file" id="eCover" accept="image/*" class="hidden" />' +
            '<div id="eCoverStage" title="点击更换封面" class="group relative cursor-pointer overflow-hidden rounded-[14px] border border-[#e8e8ed] bg-[#f5f5f7] shadow-[0_1px_4px_rgba(0,0,0,0.04)] [aspect-ratio:21/9]">' +
              '<div id="eCoverPreview" class="absolute inset-0 bg-center bg-no-repeat transition-transform duration-500 [background-size:cover] group-hover:scale-[1.03]"></div>' +
              '<div id="eCoverEmpty" class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#d2d2d7] px-4 text-center transition-colors group-hover:border-[#0071e3] group-hover:bg-[#f0f7ff]/60">' +
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.6" cy="8.6" r="1.7"/><path d="M21 15.2 16 10.2 5.4 20.8"/></svg>' +
                '<p class="text-[13px] font-medium text-[#1d1d1f]">点击选择图片，或拖拽 / Ctrl+V 粘贴到这里</p>' +
                '<p class="text-[11.5px] text-[#86868b]">支持 JPG / PNG / WebP / GIF / AVIF · 不超过 10MB</p>' +
              '</div>' +
              '<span id="eCoverBadge" class="absolute left-3 top-3 hidden rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white"></span>' +
              '<div id="eCoverActions" class="absolute bottom-3 right-3 hidden gap-2">' +
                '<button id="eCoverSwap" class="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] shadow-sm transition-colors hover:bg-[#f5f5f7]">更换</button>' +
                '<button id="eCoverDel" class="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#c0392b] shadow-sm transition-colors hover:bg-[#fff5f4]">移除</button>' +
              '</div>' +
            '</div>' +
            '<p id="eCoverMeta" class="mt-2.5 truncate text-[11.5px] text-[#a1a1a6]">未设置</p>' +
          '</div>' +
          '<div class="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            field('标题 *', '<input id="eTitle" class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10" value="' + esc(a.title) + '" />') +
            '<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">' +
              field('slug（网址名，留空自动生成）', '<input id="eSlug" class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0071e3]" value="' + esc(a.slug) + '" placeholder="留空自动生成，或填 my-post" />') +
              field('发布日期', '<input id="eDate" type="date" class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0071e3]" value="' + esc(a.publishedAt || new Date().toISOString().slice(0, 10)) + '" />') +
            '</div>' +
            '<div class="mt-4"><div class="mb-1.5 flex items-center justify-between"><label class="text-[13px] font-semibold text-[#6e6e73]">摘要（列表与 SEO description）</label>' +
              '<button type="button" id="eExcerptGen" class="rounded-md border border-[#d2d2d7] px-2 py-0.5 text-[11.5px] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3]">✨ 一键取正文开头</button></div>' +
              '<textarea id="eExcerpt" rows="2" class="w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0071e3]">' + esc(a.excerpt) + '</textarea></div>' +
            '<div class="mt-4"><div class="mb-1.5 flex flex-wrap items-center justify-between gap-2"><label class="text-[13px] font-semibold text-[#6e6e73]">正文（Markdown）*</label><span id="vdModeHint" class="hidden text-[11px] text-[#a1a1a6]"></span></div>' +
              '<div id="vditorHost" class="overflow-hidden rounded-[10px] border border-[#d2d2d7]"></div>' +
              '<textarea id="eContent" rows="18" class="hidden w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-3 font-mono text-[13px] leading-relaxed outline-none focus:border-[#0071e3]">' + esc(a.body) + '</textarea>' +
              '<div id="eStats" class="mt-1.5 text-[11.5px] text-[#a1a1a6]"></div></div>' +
          '</div>' +
        '</div>' +

        '<div class="space-y-5">' +
          '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-3 text-[13px] font-semibold text-[#6e6e73]">发布管理</p>' +
            field('状态', '<select id="eStatus" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]">' +
              (function () {
                // 与后端状态机白名单一致：非法流转直接禁用，选不了就不会保存失败
                var FLOW = {
                  draft: ['review', 'published', 'offline'],
                  review: ['published', 'draft', 'offline'],
                  published: ['offline', 'draft'],
                  offline: ['published', 'draft'],
                }
                var allowed = FLOW[a.status] || []
                return ['draft', 'review', 'published', 'offline'].map(function (s) {
                  var dis = (myRole === 'author' && (s === 'published' || s === 'offline')) ? ' disabled' : ''
                  var illegal = s !== a.status && allowed.indexOf(s) === -1 ? ' disabled' : ''
                  return '<option value="' + s + '"' + (a.status === s ? ' selected' : '') + dis + illegal + '>' + STATUS_LABEL[s] + '</option>'
                }).join('')
              })() + '</select>') +
            field('定时发布 publishAt', '<input id="ePublishAt" type="datetime-local" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]" value="' + esc(a.publishAt) + '" />', 'mt-3') +
            field('定时下线 offlineAt', '<input id="eOfflineAt" type="datetime-local" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]" value="' + esc(a.offlineAt) + '" />', 'mt-3') +
            '<div class="mt-4 flex gap-4">' +
              '<label class="flex cursor-pointer items-center gap-1.5 text-[13px]"><input id="ePinned" type="checkbox" class="accent-[#0071e3]" ' + (a.pinned ? 'checked' : '') + (myRole === 'author' ? ' disabled' : '') + ' /> 📌 置顶</label>' +
              '<label class="flex cursor-pointer items-center gap-1.5 text-[13px]"><input id="eFeatured" type="checkbox" class="accent-[#0071e3]" ' + (a.featured ? 'checked' : '') + (myRole === 'author' ? ' disabled' : '') + ' /> ⭐ 推荐</label>' +
            '</div>' +
            '<p id="eFlagHint" class="mt-2.5 text-[11.5px] leading-relaxed text-[#a1a1a6]">定时任务由本机 Studio 每 30 秒扫描执行，到点自动切换状态并推送上线（需 Studio 保持运行）。</p>' +
          '</div>' +

          '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-3 text-[13px] font-semibold text-[#6e6e73]">分类 / 标签 / SEO</p>' +
            field('分类（单选）', '<input id="eCategory" list="catList" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" value="' + esc(a.category) + '" /><datalist id="catList"></datalist>') +
            field('标签（逗号分隔）', '<input id="eTags" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" value="' + esc(a.tags.join(', ')) + '" />', 'mt-3') +
            field('SEO 关键词（逗号分隔）', '<input id="eKeywords" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" value="' + esc(a.keywords.join(', ')) + '" />', 'mt-3') +
            field('SEO 描述（留空用摘要）', '<textarea id="eSeoDesc" rows="2" class="w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]">' + esc(a.seoDescription) + '</textarea>', 'mt-3') +
            field('作者', '<select id="eAuthor" class="w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"></select>', 'mt-3') +
          '</div>' +

          '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-3 text-[13px] font-semibold text-[#6e6e73]">发布前检查</p>' +
            '<div id="eCheck" class="space-y-1.5 text-[12.5px]"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // 底栏不再用 backdrop-blur：半透明毛玻璃在滚动时每帧重算背景，是编辑器里最明显的一处掉帧
      '<div class="sticky bottom-4 z-10 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">' +
        '<span id="eMsg" class="text-[13px] text-[#1d7a35]"></span>' +
        '<div class="ml-auto flex flex-wrap gap-2.5">' +
          '<button id="eSave" class="rounded-full bg-[#1d1d1f] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-85 disabled:opacity-50">保存</button>' +
          ((myRole === 'admin' || myRole === 'editor') ?
            '<button id="eSavePub" class="rounded-full bg-[#0071e3] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)] hover:bg-[#0077ed] disabled:opacity-50">保存并发布上线</button>' :
            (isNew || a.status === 'draft') && myRole === 'author' ?
            '<button id="eSaveReview" class="rounded-full bg-[#0071e3] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#0077ed] disabled:opacity-50">保存并提交审核</button>' : '') +
        '</div>' +
      '</div>'

    var seq = viewSeq // 编辑器视图代数，异步回调凭票操作
    loadMeta().then(function (meta) {
      if (seq !== viewSeq) return
      var cat = $('catList')
      meta.taxonomy.categories.forEach(function (c) {
        var o = document.createElement('option'); o.value = c.name; cat.appendChild(o)
      })
      // 推荐位余量实时提示：后端满员拦截，这里让站长提前看到还剩几个坑
      if (meta.featured && $('eFlagHint')) {
        $('eFlagHint').textContent = '推荐位 ' + meta.featured.count + ' / ' + meta.featured.max + ' 篇，满员后无法再推荐。' + $('eFlagHint').textContent
      }
      var sel = $('eAuthor')
      meta.authors.forEach(function (au) {
        var o = document.createElement('option')
        o.value = au.name; o.textContent = au.name + ' · ' + ROLE_LABEL[au.role]
        sel.appendChild(o)
      })
      sel.value = a.author || me
      if (myRole === 'author') sel.disabled = true
    })

    var slugTouched = !isNew
    $('eTitle').addEventListener('input', function () {
      if (slugTouched) return
      var s = $('eTitle').value.toLowerCase().match(/[a-z0-9]+/g)
      $('eSlug').value = s ? s.join('-') : ''
    })
    $('eSlug').addEventListener('input', function () { slugTouched = true })
    var vb = $('eViewBlog')
    if (vb) vb.addEventListener('click', function (ev) {
      ev.preventDefault() // 按当前输入的 slug 打开，改了没保存也能看 dev 博客的实际渲染
      window.open(BLOG_URL + '/post/' + encodeURIComponent($('eSlug').value.trim()), '_blank')
    })
    /* ---- 封面图组件：点击 / 拖拽 / Ctrl+V 粘贴，实时预览+信息+更换+移除 ---- */
    var coverNew = null // 待上传的新图 File；null = 无新图
    var coverDataUrl = '' // 新图本地预览 dataURL
    var ALLOWED_COVER = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

    function renderCover(dims) {
      var has = Boolean(coverNew || a.cover)
      $('eCoverEmpty').classList.toggle('hidden', has)
      $('eCoverActions').classList.toggle('hidden', !has)
      $('eCoverBadge').classList.toggle('hidden', !has)
      var meta = $('eCoverMeta')
      if (!has) {
        $('eCoverPreview').style.backgroundImage = ''
        meta.textContent = '未设置 · 轮播推荐位与分享卡会用到封面，建议 21:9 横图'
        return
      }
      if (coverNew) {
        $('eCoverPreview').style.backgroundImage = 'url(' + coverDataUrl + ')'
        $('eCoverBadge').textContent = '待保存'
        var kb = coverNew.size / 1024
        meta.textContent = coverNew.name + (dims ? ' · ' + dims : '') + ' · ' + (kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB') + ' · 点「保存」后上传生效'
      } else {
        $('eCoverPreview').style.backgroundImage = 'url(/covers/' + encodeURIComponent(a.cover.split('/').pop()) + ')'
        $('eCoverBadge').textContent = '使用中'
        meta.textContent = a.cover.split('/').pop() + ' · 更换或移除后点「保存」生效'
      }
    }
    function setCoverFile(f) {
      if (!f) return
      var m = (f.name || '').match(/\\.([a-z0-9]+)$/i)
      var ext = m ? m[1].toLowerCase() : ''
      if (ALLOWED_COVER.indexOf(ext) < 0) return toast('不支持的图片格式：.' + ext + '（支持 JPG/PNG/WebP/GIF/AVIF）', true)
      if (f.size > 10 * 1024 * 1024) return toast('图片超过 10MB，先压缩一下再上传', true)
      coverNew = f
      var r = new FileReader()
      r.onload = function () {
        coverDataUrl = r.result
        var img = new Image()
        img.onload = function () { renderCover(img.naturalWidth + '×' + img.naturalHeight) }
        img.onerror = function () { renderCover('') }
        img.src = coverDataUrl
      }
      r.readAsDataURL(f)
    }
    function clearCover() {
      if (coverNew) { coverNew = null; coverDataUrl = '' // 只是撤掉还没保存的新图
      } else { a.cover = '' } // 移除已有封面：保存后生效
      renderCover()
    }
    function pickCover() { $('eCover').click() }
    $('eCoverStage').addEventListener('click', pickCover)
    $('eCoverSwap').addEventListener('click', function (e) { e.stopPropagation(); pickCover() })
    $('eCoverDel').addEventListener('click', function (e) { e.stopPropagation(); clearCover() })
    $('eCover').addEventListener('change', function () {
      setCoverFile($('eCover').files[0])
      $('eCover').value = '' // 允许重复选择同一文件
    })
    // 拖拽：海报区接受放下换图
    ;(function () {
      var zone = $('eCoverStage')
      zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.style.borderColor = '#0071e3' })
      zone.addEventListener('dragleave', function () { zone.style.borderColor = '' })
      zone.addEventListener('drop', function (e) {
        e.preventDefault()
        zone.style.borderColor = ''
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
        if (f) setCoverFile(f)
      })
    })()
    // Ctrl+V 粘贴截图：只在非输入焦点时接管（不干扰 Vditor 正文粘贴）
    // 注意这里是「登记视图钩子」而不是直接绑 document —— 原先每进一次编辑器就往
    // document 上叠一个 paste 监听且永不摘除，进出几次后一次粘贴会触发一串回调
    viewPasteHook = function (e) {
      var t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      var items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && /^image\\//.test(items[i].type)) {
          var f = items[i].getAsFile()
          if (f) {
            e.preventDefault()
            if (!/\\.[a-z0-9]+$/i.test(f.name || '')) {
              f = new File([f], 'paste-' + Date.now() + '.png', { type: f.type }) // 剪贴板截图常无扩展名，补一个
            }
            setCoverFile(f)
          }
          return
        }
      }
    }
    renderCover()

    /* ---- 写作助手：Vditor 富文本编辑 / 统计 / 发布检查 / 本地草稿 ---- */
    var contentEl = $('eContent')
    var vd = null // Vditor 实例；null = 未加载或降级为纯 textarea
    function getContent() { return vd ? vd.getValue() : contentEl.value }
    function setContent(v) { if (vd) { vd.setValue(v) } else { contentEl.value = v } }

    // 按需注入 Vditor 资源（只在进编辑器时加载，不拖慢后台其他页面）
    function ensureVditor(cb) {
      if (window.Vditor) return cb()
      if (!$('vdCss')) {
        var l = document.createElement('link'); l.id = 'vdCss'; l.rel = 'stylesheet'; l.href = '/vditor/dist/index.css'
        document.head.appendChild(l)
      }
      var s = $('vdJs')
      if (!s) {
        s = document.createElement('script'); s.id = 'vdJs'; s.src = '/vditor/dist/index.min.js'
        s.onload = function () { cb() }
        s.onerror = function () { cb() } // 加载失败也回调，走 textarea 降级
        document.head.appendChild(s)
      } else {
        s.addEventListener('load', function () { cb() })
      }
    }

    function fallbackToTextarea(reason) {
      if (vd) return
      $('vditorHost').classList.add('hidden')
      contentEl.classList.remove('hidden')
      var hint = $('vdModeHint')
      hint.classList.remove('hidden')
      hint.textContent = reason
    }

    /* 图片上传：粘贴 / 选择图片 → 传到 /api/upload 落成文件 → 正文只留 URL
     *
     * Vditor 在「没配 upload」时会自作主张把粘贴的截图转成 data URI 直接写进正文，
     * 那种写法会被原样编译进前端 bundle（一张 200KB 的图就顶起首屏体积一大截），
     * 所以这里必须接住所有图片入口。
     */
    var MAX_UPLOAD_BYTES = 4 * 1024 * 1024
    var UPLOAD_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']

    function uploadImageHandler(files) {
      var file = files && files[0]
      if (!file) return null
      if (file.size > MAX_UPLOAD_BYTES) {
        toast('图片超过 4MB，请先压缩再上传', true)
        return null
      }
      var rawName = String(file.name || 'pasted.png')
      var dot = rawName.lastIndexOf('.')
      var ext = dot >= 0 ? rawName.slice(dot).toLowerCase() : ''
      if (UPLOAD_EXTS.indexOf(ext) < 0) {
        toast('仅支持 jpg / png / webp / gif / avif', true)
        return null
      }
      return new Promise(function (resolve) {
        var reader = new FileReader()
        reader.onload = function () {
          var dataUrl = String(reader.result || '')
          var comma = dataUrl.indexOf(',')
          var base64 = comma >= 0 ? dataUrl.slice(comma + 1) : ''
          if (!base64) {
            toast('图片读取失败', true)
            resolve(null)
            return
          }
          var slugBase = ($('eSlug') && $('eSlug').value.trim()) || 'img'
          api('/api/upload', {
            method: 'POST',
            // 带时间戳：正文里可能插多张图，只用 slug 会互相覆盖（封面重传覆盖是另一条路径）
            body: { name: rawName, dataBase64: base64, slug: slugBase + '-' + Date.now() },
          })
            .then(function (r) {
              toast('图片已上传')
              resolve('/images/covers/' + r.fileName)
            })
            .catch(function (e) {
              toast(e.message || '图片上传失败', true)
              resolve(null)
            })
        }
        reader.onerror = function () {
          toast('图片读取失败', true)
          resolve(null)
        }
        reader.readAsDataURL(file)
      })
    }

    function initVditor() {
      if (!window.Vditor || typeof window.Vditor !== 'function') return fallbackToTextarea('（编辑器脚本加载失败，已降级为纯文本输入）')
      try {
        vd = new window.Vditor('vditorHost', {
          cdn: '/vditor',
          mode: 'wysiwyg',
          value: contentEl.value,
          height: 560,
          cache: { enable: false },
          counter: { enable: true, type: 'markdown' },
          toolbar: [
            'headings', 'bold', 'italic', 'strike', '|',
            'list', 'ordered-list', 'check', 'quote', '|',
            'link', 'upload', 'table', 'code', 'inline-code', '|',
            'undo', 'redo', '|', 'edit-mode', 'fullscreen', 'export', '|', 'help',
          ],
          // 所有图片入口都走这里，正文只存 /images/covers/xxx 地址，绝不落 data URI
          upload: { handler: uploadImageHandler },
          input: function (v) { onContentChange(v) },
          after: function () {
            // Vditor 异步初始化完成后同步一次初始状态
            var v = getContent()
            updateStats(v)
            scheduleDraft()
          },
        })
        contentEl.classList.add('hidden')
      } catch (e) {
        vd = null
        fallbackToTextarea('（编辑器初始化异常，已降级为纯文本输入）')
      }
    }

    // 离开编辑器时收拾干净 —— 这是切换卡顿的主因：Vditor 实例不 destroy，
    // 它的全局监听与内部 DOM 就一直挂着，每进出一次多留一份，切几轮后明显发顿。
    onLeave(function () {
      if (vd && typeof vd.destroy === 'function') {
        try { vd.destroy() } catch (e) { /* 实例状态异常也要放行导航 */ }
      }
      vd = null
      clearTimeout(draftTimer)
      viewPasteHook = null
      editDirty = false
    })

    function onContentChange(v) {
      markDirty()
      updateStats(v)
      updateCheck()
    }
    function updateStats(v) {
      var n = (typeof v === 'string' ? v : getContent()).trim().length
      $('eStats').textContent = n + ' 字符 · 预计阅读 ' + (n ? Math.max(1, Math.round(n / 350)) : 0) + ' 分钟'
    }
    function updateCheck() {
      var rows = [
        ['封面图（轮播位必需）', Boolean(a.cover || coverNew)],
        ['摘要（列表卡与 SEO）', Boolean($('eExcerpt').value.trim())],
        ['标签 ≥ 1', $('eTags').value.trim().length > 0],
        ['分类', Boolean($('eCategory').value.trim())],
        ['SEO 描述', Boolean($('eSeoDesc').value.trim())],
        ['slug 规范（小写字母/数字/连字符，留空自动生成）', $('eSlug').value.trim() === '' || /^[a-z0-9][a-z0-9-]*$/.test($('eSlug').value.trim())],
        // 内联 base64 图片会被整段打进前台 bundle，构建期也会直接报错拦下
        ['正文无内联图片（一律走上传）', getContent().indexOf('data:image') < 0],
      ]
      $('eCheck').innerHTML = rows.map(function (r) {
        return '<div class="flex items-center gap-2"><span>' + (r[1] ? '✅' : '⬜') + '</span><span class="' + (r[1] ? 'text-[#1d7a35]' : 'text-[#86868b]') + '">' + r[0] + '</span></div>'
      }).join('')
    }

    var DKEY = 'studio-draft-new'
    var draftTimer = null
    function scheduleDraft() {
      if (!isNew) return // 只对新建自动存草稿；编辑旧文以服务器为准
      clearTimeout(draftTimer)
      draftTimer = setTimeout(function () {
        try {
          localStorage.setItem(DKEY, JSON.stringify({
            title: $('eTitle').value, slug: $('eSlug').value, publishedAt: $('eDate').value,
            excerpt: $('eExcerpt').value, content: getContent(), category: $('eCategory').value,
            tags: $('eTags').value, keywords: $('eKeywords').value, seoDescription: $('eSeoDesc').value, ts: Date.now(),
          }))
        } catch (e) { /* 隐私模式存不了就算了 */ }
      }, 800)
    }
    function markDirty() {
      editDirty = true
      scheduleDraft()
    }
    ;['eTitle', 'eSlug', 'eDate', 'eExcerpt', 'eContent', 'eTags', 'eCategory', 'eKeywords', 'eSeoDesc'].forEach(function (id) {
      var el = $(id)
      el.addEventListener('input', function () { markDirty(); updateCheck() })
    })
    contentEl.addEventListener('input', function () { updateStats() })
    updateStats()
    updateCheck()

    // 可编辑用户 → 起 Vditor；只读查看者 → 直接用 textarea 展示
    if (canEdit) {
      ensureVditor(function () { if (seq === viewSeq) initVditor() })
      setTimeout(function () {
        if (seq !== viewSeq) return // 视图已切换，丢弃过期回调
        if (!vd && !window.Vditor) fallbackToTextarea('（编辑器加载超时，已降级为纯文本输入）')
      }, 8000)
    } else {
      fallbackToTextarea('')
    }

    if (isNew) {
      var draft = null
      try { draft = JSON.parse(localStorage.getItem(DKEY) || 'null') } catch (e) { /* 忽略坏数据 */ }
      if (draft && (draft.title || (draft.content || '').trim())) {
        var dbar = $('eDraftBar')
        dbar.classList.remove('hidden')
        dbar.classList.add('flex')
        $('eDraftInfo').textContent = '检测到 ' + new Date(draft.ts).toLocaleString() + ' 的本地草稿' + (draft.title ? '：「' + draft.title.slice(0, 30) + '」' : '')
        $('eDraftRestore').addEventListener('click', function () {
          $('eTitle').value = draft.title || ''
          $('eSlug').value = draft.slug || ''
          slugTouched = true
          $('eDate').value = draft.publishedAt || $('eDate').value
          $('eExcerpt').value = draft.excerpt || ''
          setContent(draft.content || '')
          $('eCategory').value = draft.category || ''
          $('eTags').value = draft.tags || ''
          $('eKeywords').value = draft.keywords || ''
          $('eSeoDesc').value = draft.seoDescription || ''
          $('eDraftBar').classList.add('hidden')
          updateStats()
          updateCheck()
          toast('草稿已恢复')
        })
        $('eDraftDrop').addEventListener('click', function () {
          localStorage.removeItem(DKEY)
          dbar.classList.remove('flex')
          dbar.classList.add('hidden')
          toast('草稿已丢弃')
        })
      }
    }

    $('eExcerptGen').addEventListener('click', function () {
      var s = getContent()
        .replace(/\`\`\`[\\s\\S]*?\`\`\`/g, ' ')
        .replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g, ' ')
        .replace(/\\[([^\\]]+)\\]\\([^)]*\\)/g, '$1')
        .replace(/^#{1,6}\\s+/gm, '')
        .replace(/[*\`>_~-]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim()
      if (!s) return toast('正文还是空的，写点内容再生成', true)
      $('eExcerpt').value = s.slice(0, 90)
      updateCheck()
      markDirty()
      toast('已按正文开头生成 90 字摘要，记得润色')
    })

    function collect() {
      return {
        title: $('eTitle').value.trim(),
        slug: $('eSlug').value.trim(),
        publishedAt: $('eDate').value,
        excerpt: $('eExcerpt').value.trim(),
        content: getContent(),
        status: $('eStatus').value,
        pinned: $('ePinned').checked,
        featured: $('eFeatured').checked,
        category: $('eCategory').value.trim(),
        tags: $('eTags').value.split(/[,，]/).map(function (t) { return t.trim() }).filter(Boolean),
        keywords: $('eKeywords').value.split(/[,，]/).map(function (t) { return t.trim() }).filter(Boolean),
        seoDescription: $('eSeoDesc').value.trim(),
        author: $('eAuthor').value,
        publishAt: $('ePublishAt').value.replace('T', ' '),
        offlineAt: $('eOfflineAt').value.replace('T', ' '),
        cover: a.cover,
      }
    }

    function save(patch, then) {
      if (seq !== viewSeq) return // 视图已切换
      var data = collect()
      Object.assign(data, patch || {})
      // 主动发布时清掉定时发布时间，否则到点后调度器行为和预期不符
      if (data.status === 'published' && a.status !== 'published') data.publishAt = ''
      if (!data.title) return toast('标题不能为空', true)
      if (!data.content.trim()) return toast('正文不能为空', true)
      $('eSave').disabled = true
      var finishUpload = coverNew
        ? new Promise(function (ok2, bad) {
            var r = new FileReader()
            r.onload = function () { ok2(r.result) }; r.onerror = bad
            r.readAsDataURL(coverNew)
          }).then(function (b64) {
            return api('/api/upload', { method: 'POST', body: { name: coverNew.name, dataBase64: b64, slug: data.slug || 'cover' } })
          }).then(function (up) { data.cover = '/images/covers/' + up.fileName })
        : Promise.resolve()

      finishUpload.then(function () {
        var req = isNew
          ? api('/api/articles', { method: 'POST', body: data })
          : api('/api/article/' + encodeURIComponent(a.file), { method: 'PUT', body: data })
        return req.then(function (d2) {
          editDirty = false
          if (isNew) { try { localStorage.removeItem(DKEY) } catch (e) { /* 忽略 */ } }
          $('eMsg').textContent = '✓ 已保存 ' + new Date().toLocaleTimeString()
          toast('保存成功')
          if (d2.file) a.file = d2.file
          if (isNew) location.hash = '#/editor/' + encodeURIComponent(d2.file)
          if (then) then(d2)
        })
      }).catch(function (e) { toast(e.message, true) })
        .finally(function () { $('eSave').disabled = false })
    }

    $('eSave').addEventListener('click', function () { save() })
    var pub = $('eSavePub')
    if (pub) pub.addEventListener('click', function () {
      save({ status: 'published' }, function () {
        confirmBox('已保存为已发布，现在推送到线上？', 'git commit + push，Vercel 自动构建', function () {
          $('syncPanel').classList.remove('hidden')
          $('syncLog').textContent = '正在启动推送任务…'
          api('/api/sync', { method: 'POST', body: {} }).then(function (d) { pollSync(d.jobId) }).catch(function (e) { syncFail(e.message) })
        })
      })
    })
    var rev = $('eSaveReview')
    if (rev) rev.addEventListener('click', function () { save({ status: 'review' }) })
  }).catch(function (e) {
    view.innerHTML = '<p class="text-sm text-[#c0392b]">加载失败：' + esc(e.message) + '</p>'
  })
})

function blankArticle() {
  return {
    file: '', slug: '', title: '', excerpt: '', publishedAt: new Date().toISOString().slice(0, 10),
    tags: [], category: '', author: me, status: 'draft', pinned: false, featured: false,
    keywords: [], seoDescription: '', publishAt: '', offlineAt: '', cover: '', body: '',
  }
}

function field(label, control, extra) {
  return '<div class="' + (extra || '') + '"><label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">' + label + '</label>' + control + '</div>'
}

/* ================= 视图：回收站 ================= */
onRoute('trash', function () {
  api('/api/trash').then(function (d) {
    view.innerHTML = pageHead({ title: '回收站', desc: '删除的文章在这里，可恢复；彻底删除不可恢复（仅管理员）' }) +
      '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[13.5px]"><tbody>' +
      (d.trash.length ? d.trash.map(function (t) {
        return '<tr class="border-b border-[#f0f0f2] last:border-0">' +
          '<td class="px-5 py-3.5"><div class="font-medium">' + esc(t.title) + '</div>' +
          '<div class="text-[11.5px] text-[#a1a1a6]">删除于 ' + esc(t.deletedAt.slice(0, 16).replace('T', ' ')) + ' · 由 ' + esc(t.deletedBy) + ' · 原状态：' + (STATUS_LABEL[t.status] || t.status) + '</div></td>' +
          '<td class="px-5 py-3.5 text-right"><div class="flex justify-end gap-2">' +
          '<button data-restore="' + esc(t.trashName) + '" class="rounded-full border border-[#0071e3] px-3.5 py-1 text-[12px] text-[#0071e3] hover:bg-[#e8f1fd]">恢复</button>' +
          (myRole === 'admin' ? '<button data-purge="' + esc(t.trashName) + '" class="rounded-full border border-[#f0d0d0] px-3.5 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdecec]">彻底删除</button>' : '') +
          '</div></td></tr>'
      }).join('') : emptyRow(2, '回收站是空的')) +
      '</tbody></table></div></div>'

    d.trash.forEach(function (t) {
      var r = document.querySelector('[data-restore="' + t.trashName + '"]')
      if (r) r.onclick = function () {
        api('/api/trash/restore', { method: 'POST', body: { trashName: t.trashName } })
          .then(function (d) {
            toast(d.slugConflict ? '已恢复，但 slug 与现有文章重复，编辑时请改名' : '已恢复', d.slugConflict)
            loadMeta(); navigate()
          })
          .catch(function (e) { toast(e.message, true) })
      }
      var p = document.querySelector('[data-purge="' + t.trashName + '"]')
      if (p) p.onclick = function () {
        confirmBox('彻底删除「' + t.title + '」？', '不可恢复，谨慎操作', function () {
          api('/api/trash/' + encodeURIComponent(t.trashName), { method: 'DELETE' })
            .then(function () { toast('已彻底删除'); navigate() })
            .catch(function (e) { toast(e.message, true) })
        })
      }
    })
  })
})

/* ================= 视图：自定义页面 ================= */

// 页面状态徽标：草稿 / 未上线（已发布但没进菜单也没开直链）/ 已发布
function pageBadge(p) {
  if (p.status !== 'published') return { text: '草稿', cls: 'bg-[#f0f0f2] text-[#6e6e73]' }
  if (!p.reachable) return { text: '未上线', cls: 'bg-[#fdf3e6] text-[#9a6400]' }
  return { text: p.directAccess ? '已发布 · 直链' : '已发布', cls: 'bg-[#e8f3ec] text-[#1d7a35]' }
}

onRoute('pages', function () {
  var seq = viewSeq
  var canEdit = myRole === 'admin' || myRole === 'editor'
  api('/api/pages').then(function (d) {
    if (seq !== viewSeq) return
    var rows = d.pages.map(function (p) {
      var badge = pageBadge(p)
      var sub = '/page/' + esc(p.slug)
      if (p.error) sub += ' · ⚠ ' + esc(p.error)
      else if (p.status === 'published' && !p.reachable) sub += ' · 未上线：没进菜单也没开直链 → 前台 404'
      return '<tr class="border-b border-[#f0f0f2] last:border-0">' +
        '<td class="px-5 py-3.5"><div class="font-medium">' + esc(p.title || '(无标题)') + '</div>' +
        '<div class="text-[11.5px] text-[#a1a1a6]">' + sub + '</div></td>' +
        '<td class="px-5 py-3.5"><span class="rounded-full px-2.5 py-1 text-[11.5px] font-medium ' + badge.cls + '">' + badge.text + '</span></td>' +
        '<td class="px-5 py-3.5 text-[12px] text-[#86868b]">' + (p.updatedAt ? esc(p.updatedAt.slice(0, 16).replace('T', ' ')) : '-') + '</td>' +
        '<td class="px-5 py-3.5 text-right"><div class="flex justify-end gap-2">' +
        (canEdit ? '<button data-edit="' + esc(p.slug) + '" class="rounded-full border border-[#0071e3] px-3.5 py-1 text-[12px] text-[#0071e3] hover:bg-[#e8f1fd]">编辑</button>' : '') +
        (p.reachable ? '<button data-view="' + esc(p.slug) + '" class="rounded-full border border-[#d2d2d7] px-3.5 py-1 text-[12px] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3]">前台查看</button>' : '') +
        (canEdit ? '<button data-del="' + esc(p.slug) + '" data-title="' + esc(p.title) + '" class="rounded-full border border-[#f0d0d0] px-3.5 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdecec]">删除</button>' : '') +
        '</div></td></tr>'
    })
    view.innerHTML =
      pageHead({
        title: '自定义页面',
        desc: '独立于文章的静态页。前台可访问 = 已发布 且（已加入导航菜单 或 开启「允许直接访问」），两者都没有则 /page/slug 返回 404',
        actions: canEdit ? primaryBtn('#/pages/new', '＋ 新建页面') : '',
      }) +
      '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[13.5px]">' +
        '<thead class="bg-[#fafafa] text-[12px] text-[#86868b]"><tr>' +
          '<th class="px-5 py-3 font-medium">页面</th><th class="px-5 py-3 font-medium">状态</th><th class="px-5 py-3 font-medium">更新时间</th><th class="px-5 py-3 text-right font-medium">操作</th>' +
        '</tr></thead><tbody>' +
        (rows.length ? rows.join('') : emptyRow(4, '还没有自定义页面' + (canEdit ? '，点右上角「新建页面」创建' : ''))) +
      '</tbody></table></div></div>'

    d.pages.forEach(function (p) {
      var e = document.querySelector('[data-edit="' + p.slug + '"]')
      if (e) e.onclick = function () { location.hash = '#/pages/edit/' + encodeURIComponent(p.slug) }
      var v = document.querySelector('[data-view="' + p.slug + '"]')
      if (v) v.onclick = function () { window.open(BLOG_URL + '/page/' + encodeURIComponent(p.slug), '_blank') }
      var del = document.querySelector('[data-del="' + p.slug + '"]')
      if (del) del.onclick = function () {
        confirmBox('删除页面「' + (p.title || p.slug) + '」？', '文件物理删除不可恢复；引用它的导航菜单项保存站点设置时会提示失效', function () {
          api('/api/pages/' + encodeURIComponent(p.slug), { method: 'DELETE' })
            .then(function () { toast('已删除'); navigate() })
            .catch(function (e2) { toast(e2.message, true) })
        })
      }
    })
  })
})

onRoute('pages/*', function (arg) {
  var seq = viewSeq
  var canEdit = myRole === 'admin' || myRole === 'editor'
  if (!canEdit) { view.innerHTML = '<p class="text-sm text-[#86868b]">自定义页面仅管理员/编辑可操作</p>'; return }
  var isNew = arg === 'new'
  var slug = isNew ? '' : decodeURIComponent(String(arg).replace('edit/', ''))
  var referenced = false // 当前是否已被导航菜单引用（load 后回填）
  var load = isNew ? Promise.resolve({ page: null }) : api('/api/pages/' + encodeURIComponent(slug))

  view.innerHTML =
    pageHead({
      crumbs: [{ label: '自定义页面', href: '#/pages' }, { label: isNew ? '新建页面' : (slug || '编辑页面') }],
      title: isNew ? '新建页面' : '编辑页面',
    }) +
    '<div class="w-full rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
      '<div class="grid gap-4 md:grid-cols-3">' +
        '<label class="block text-[12.5px] text-[#6e6e73] md:col-span-2">页面标题' +
          '<input id="pgTitle" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" placeholder="如：常见问题" /></label>' +
        '<label class="block text-[12.5px] text-[#6e6e73]">slug（URL 标识，建后不可改）' +
          '<input id="pgSlug" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 font-mono text-[13px] outline-none focus:border-[#0071e3]" placeholder="如：faq"' + (isNew ? '' : ' disabled') + ' /></label>' +
        '<label class="block text-[12.5px] text-[#6e6e73] md:col-span-2">SEO 描述（选填，最长 160 字）' +
          '<input id="pgDesc" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" /></label>' +
        '<label class="block text-[12.5px] text-[#6e6e73]">状态' +
          '<select id="pgStatus" class="mt-1 w-40 rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"><option value="published">已发布</option><option value="draft">草稿（仅后台可见）</option></select></label>' +
        '<div class="rounded-xl bg-[#f5f5f7] px-4 py-3 md:col-span-3">' +
          '<label class="flex items-center gap-2.5 text-[13px] font-medium text-[#1d1d1f]"><input id="pgDirect" type="checkbox" class="h-4 w-4 shrink-0" />允许直接访问（分享 /page/slug 链接即可打开）</label>' +          '<label class="flex items-center gap-2.5 text-[13px] font-medium text-[#1d1d1f]" style="margin-top:12px"><input id="pgFullHtml" type="checkbox" class="h-4 w-4 shrink-0" />完整 HTML 独立页（iframe 隔离渲染，支持 &lt;script&gt; 交互）</label>' +          '<p class="mt-1.5 text-[11.5px] leading-relaxed text-[#86868b]">开启后正文按「完整 HTML 文档」渲染（可含 DOCTYPE / &lt;script&gt; 点击事件等），用 sandbox iframe 隔离，不影响主站安全；关闭则按「Markdown + HTML 片段」规则渲染</p>' +
          '<p class="mt-1.5 text-[11.5px] leading-relaxed text-[#86868b]">关闭时：只有出现在导航菜单里的页面，前台才能访问（该菜单在电脑顶栏与手机抽屉同时生效）；不在菜单里 → 前台 404，无法用 URL 强行打开</p>' +
          '<p class="mt-2.5 flex flex-wrap items-center gap-2"><span id="pgAccess" class="text-[12px] font-medium"></span>' +
            '<button id="pgCopy" class="rounded-full border border-[#d2d2d7] bg-white px-2.5 py-0.5 text-[11.5px] text-[#6e6e73] hover:border-[#0071e3] hover:text-[#0071e3]">复制地址</button></p>' +
        '</div>' +
      '</div>' +
      '<label class="mt-4 block text-[12.5px] text-[#6e6e73]">正文（Markdown + HTML 片段）' +
        '<textarea id="pgBody" rows="18" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-3 py-2.5 font-mono text-[13px] leading-relaxed outline-none focus:border-[#0071e3]" placeholder="支持与文章相同的 Markdown 语法；行首写块级 HTML 标签（如 &lt;div&gt;）可搭自定义版式"></textarea></label>' +
      '<p class="mt-2 text-[11.5px] leading-relaxed text-[#a1a1a6]">HTML 片段规则：行首以白名单标签开头（div / span / p / table / figure 等）即视为 HTML 块；可用 class / id / style 等属性（style 里不能有站外 url() 与表达式）；script / style / iframe / form 等连同内容整体丢弃，未知标签只丢标签保文字；h1 自动归一为 h2。写法示例：&lt;div class="card" style="padding:12px"&gt;…&lt;/div&gt;</p>' +
      '<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-[#f0f0f2] pt-4">' +
        '<span id="pgMsg" class="text-[13px] text-[#1d7a35]"></span>' +
        (isNew ? '' : '<button id="pgDel" class="rounded-full border border-[#f0d0d0] px-4 py-2 text-[12.5px] text-[#c0392b] hover:bg-[#fdecec]">删除此页面</button>') +
        '<button id="pgSave" class="ml-auto rounded-full bg-[#0071e3] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#0077ed]">' + (isNew ? '创建页面' : '保存页面') + '</button>' +
      '</div>' +
    '</div>'

  load.then(function (d) {
    if (seq !== viewSeq) return
    var p = d.page
    $('pgTitle').value = p ? p.title : ''
    $('pgSlug').value = p ? p.slug : ''
    $('pgDesc').value = p ? p.description : ''
    $('pgStatus').value = p ? p.status : 'published'
    $('pgDirect').checked = p ? !!p.directAccess : false
    $('pgBody').value = p ? p.body : ''
    referenced = p ? !!p.referenced : false
    syncAccess()
  }).catch(function (e) {
    if (seq !== viewSeq) return
    toast(e.message, true)
    location.hash = '#/pages'
  })

  /* 可达性实时提示：状态 / 直链开关 / slug 任一变化都重算，避免「以为上线了其实 404」 */
  function realSlug() { return isNew ? $('pgSlug').value.trim() : slug }
  function syncAccess() {
    var st = $('pgStatus').value
    var direct = $('pgDirect').checked
    var path = '/page/' + (realSlug() || 'slug')
    var el = $('pgAccess')
    var copyBtn = $('pgCopy')
    var passCls = 'text-[12px] font-medium text-[#1d7a35]'
    var warnCls = 'text-[12px] font-medium text-[#9a6400]'
    var muteCls = 'text-[12px] font-medium text-[#6e6e73]'
    var canOpen
    if (st !== 'published') {
      el.className = muteCls
      el.textContent = '草稿：前台不可访问，' + path + ' 返回 404'
      canOpen = false
    } else if (direct) {
      el.className = passCls
      el.textContent = '可访问（直链）：任何人可通过 ' + path + ' 打开'
      canOpen = true
    } else if (referenced) {
      el.className = passCls
      el.textContent = '可访问（菜单）：从前台导航菜单进入 ' + path
      canOpen = true
    } else {
      el.className = warnCls
      el.textContent = '未上线：没进导航菜单也没开直链，' + path + ' 返回 404 —— 去「站点设置 → 导航菜单」加入本页，或勾选上面的直链开关'
      canOpen = false
    }
    copyBtn.style.display = canOpen ? '' : 'none'
  }
  $('pgStatus').addEventListener('change', syncAccess)
  $('pgDirect').addEventListener('change', syncAccess)
  $('pgSlug').addEventListener('input', syncAccess)
  $('pgCopy').onclick = function () {
    var s = realSlug()
    if (!s) { toast('先填 slug', true); return }
    var link = BLOG_URL + '/page/' + s
    navigator.clipboard.writeText(link).then(function () {
      toast('已复制：' + link)
    }).catch(function () {
      toast('复制失败，请手动复制：' + link, true)
    })
  }

  $('pgSave').onclick = function () {
    var title = $('pgTitle').value.trim()
    var s = (isNew ? $('pgSlug').value.trim() : slug)
    var body = $('pgBody').value
    if (!title) { toast('页面标题不能为空', true); return }
    if (!s) { toast('slug 不能为空', true); return }
    api('/api/pages', { method: 'PUT', body: { slug: s, title: title, description: $('pgDesc').value.trim(), status: $('pgStatus').value, directAccess: $('pgDirect').checked, fullHtml: $('pgFullHtml').checked, body: body } })
      .then(function (r) {
        referenced = !!r.referenced
        $('pgMsg').textContent = r.status !== 'published'
          ? '已保存 ✓ 草稿：前台不可访问'
          : r.reachable
            ? '已保存 ✓ 前台可访问：' + r.url
            : '已保存 ✓ 未上线：' + r.url + ' 会 404'
        toast(isNew ? '页面已创建' : '页面已保存')
        syncAccess()
        if (isNew) location.hash = '#/pages/edit/' + encodeURIComponent(s)
      })
      .catch(function (e) { toast(e.message, true) })
  }
  var delBtn = $('pgDel')
  if (delBtn) delBtn.onclick = function () {
    confirmBox('删除页面「' + slug + '」？', '文件物理删除不可恢复', function () {
      api('/api/pages/' + encodeURIComponent(slug), { method: 'DELETE' })
        .then(function () { toast('已删除'); location.hash = '#/pages' })
        .catch(function (e) { toast(e.message, true) })
    })
  }
})

/* ================= 视图：分类与标签 ================= */
onRoute('taxonomy', function () {
  loadMeta().then(function (meta) {
    var block = function (title, type, list) {
      return '<div class="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-3 text-[15px] font-semibold">' + title + '</p><div class="space-y-1.5">' +
        (list.length ? list.map(function (t) {
          var editable = myRole === 'admin' || myRole === 'editor'
          return '<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f5f5f7]">' +
            '<span class="flex-1 text-[13.5px]">' + esc(t.name) + '</span>' +
            '<span class="text-xs text-[#a1a1a6]">' + t.count + ' 篇</span>' +
            (editable ? '<button data-rename="' + type + '" data-from="' + esc(t.name) + '" class="rounded-full border border-[#d2d2d7] px-2.5 py-0.5 text-[11.5px] hover:bg-white">重命名</button>' : '') +
            '</div>'
        }).join('') : '<p class="py-4 text-center text-[13px] text-[#a1a1a6]">暂无</p>') +
        '</div></div>'
    }
    view.innerHTML = pageHead({ title: '分类与标签', desc: '重命名会全站同步更新所有文章' }) +
      '<div class="grid grid-cols-1 gap-5 md:grid-cols-2">' +
      block('分类（单分类体系）', 'category', meta.taxonomy.categories) +
      block('标签（多标签体系）', 'tag', meta.taxonomy.tags) + '</div>'

    view.querySelectorAll('[data-rename]').forEach(function (b) {
      b.addEventListener('click', function () {
        var to = prompt('重命名为：', b.dataset.from)
        if (!to || to === b.dataset.from) return
        api('/api/taxonomy/rename', { method: 'POST', body: { type: b.dataset.rename, from: b.dataset.from, to: to } })
          .then(function (d2) { toast('已重命名，' + d2.changed.length + ' 篇文章同步更新'); navigate() })
          .catch(function (e) { toast(e.message, true) })
      })
    })
  })
})

/* ================= 视图：作者与权限 ================= */
onRoute('authors', function () {
  api('/api/authors').then(function (d) {
    var isAdmin = d.me.role === 'admin'
    view.innerHTML = pageHead({ title: '作者与权限', desc: '本地工具无登录体系，身份用于操作授权与日志追溯（管理员 / 编辑 / 作者）' }) +
      '<div class="rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[13.5px]"><thead class="bg-[#fafafa] text-[12px] text-[#86868b]"><tr>' +
      '<th class="px-5 py-2.5">作者</th><th class="px-3 py-2.5">角色</th><th class="px-3 py-2.5">权限说明</th><th class="px-5 py-2.5 text-right">操作</th></tr></thead><tbody>' +
      d.authors.map(function (a) {
        var perm = { admin: '全部操作 + 作者管理 + 彻底删除', editor: '发布/编辑/下线/回收站/批量/推送', author: '只能编辑自己的文章，提交审核' }[a.role]
        return '<tr class="border-t border-[#f0f0f2]">' +
          '<td class="px-5 py-3 font-medium">' + esc(a.name) + '</td>' +
          '<td class="px-3 py-3"><span class="rounded-full bg-[#f0f0f2] px-2.5 py-1 text-[11.5px]">' + ROLE_LABEL[a.role] + '</span></td>' +
          '<td class="px-3 py-3 text-[12.5px] text-[#6e6e73]">' + perm + '</td>' +
          '<td class="px-5 py-3 text-right">' + (isAdmin && a.role !== 'admin' ? '<button data-del="' + esc(a.name) + '" class="rounded-full border border-[#f0d0d0] px-3 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdecec]">移除</button>' : '') + '</td></tr>'
      }).join('') + '</tbody></table></div></div>' +
      (isAdmin ?
        '<div class="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<div><label class="mb-1 block text-[12.5px] font-semibold text-[#6e6e73]">作者名</label><input id="aName" class="rounded-lg border border-[#d2d2d7] px-3 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" /></div>' +
        '<div><label class="mb-1 block text-[12.5px] font-semibold text-[#6e6e73]">角色</label><select id="aRole" class="rounded-lg border border-[#d2d2d7] px-3 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"><option value="author">作者</option><option value="editor">编辑</option><option value="admin">管理员</option></select></div>' +
        '<button id="aAdd" class="rounded-full bg-[#0071e3] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#0077ed]">添加</button></div>' : '')

    var add = $('aAdd')
    if (add) add.addEventListener('click', function () {
      api('/api/authors', { method: 'POST', body: { name: $('aName').value.trim(), role: $('aRole').value } })
        .then(function () { toast('已添加'); navigate() })
        .catch(function (e) { toast(e.message, true) })
    })
    view.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        confirmBox('移除作者「' + b.dataset.del + '」？', '其文章不受影响，只是无法再以此身份操作', function () {
          api('/api/authors/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' })
            .then(function () { toast('已移除'); navigate() })
            .catch(function (e) { toast(e.message, true) })
        })
      })
    })
  })
})

/* ================= 视图：操作日志 ================= */
onRoute('logs', function () {
  api('/api/logs?limit=300').then(function (d) {
    view.innerHTML = pageHead({ title: '操作日志', desc: '最近 ' + d.logs.length + ' 条，新到旧；jsonl 追加存储于 .studio/logs.jsonl' }) +
      '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[12.5px]"><thead class="bg-[#fafafa] text-[11.5px] text-[#86868b]"><tr>' +
      '<th class="px-5 py-2.5">时间</th><th class="px-3 py-2.5">身份</th><th class="px-3 py-2.5">动作</th><th class="px-3 py-2.5">对象</th><th class="px-5 py-2.5">详情</th></tr></thead><tbody>' +
      (d.logs.length ? d.logs.map(function (l) {
        return '<tr class="border-t border-[#f0f0f2]">' +
          '<td class="whitespace-nowrap px-5 py-2.5 text-[#86868b]">' + esc(l.ts.slice(5, 16).replace('T', ' ')) + '</td>' +
          '<td class="px-3 py-2.5">' + esc(l.actor) + '</td>' +
          '<td class="px-3 py-2.5"><span class="rounded-full bg-[#f0f0f2] px-2 py-0.5 font-mono text-[11px]">' + esc(l.action) + '</span></td>' +
          '<td class="max-w-[220px] truncate px-3 py-2.5 font-mono text-[11.5px] xl:max-w-[420px]">' + esc(l.target) + '</td>' +
          '<td class="px-5 py-2.5 text-[#6e6e73]">' + esc(l.detail) + '</td></tr>'
      }).join('') : emptyRow(5, '还没有操作记录')) +
      '</tbody></table></div></div>'
  }).catch(function (e) {
    view.innerHTML = '<p class="text-sm text-[#c0392b]">' + esc(e.message) + '</p>'
  })
})

/* ================= 视图：站点设置（content/site.json 增删改查） ================= */
onRoute('site', function () {
  view.className = 'w-full' // 与全局统一：占满不留白
  // 站点配置 + 已发布自定义页面（导航「页面」下拉动态列出）
  Promise.all([api('/api/site'), api('/api/pages').catch(function () { return { pages: [] } })]).then(function (rs) {
    var d = rs[0]
    var publishedPages = (rs[1].pages || []).filter(function (p) { return p.status === 'published' })
    var s = d.site.site
    var readOnly = myRole !== 'admin' && myRole !== 'editor'
    var NL = String.fromCharCode(10) // 客户端脚本经字符串内联，禁用转义序列，换行用 charCode 构造
    var abPage = d.site.aboutPage || { intro: '', techStack: [], milestones: [] }
    // 每行「A | B」解析为对象数组；缺竖线的行报错提示
    function parseRows(raw, label, kName, vName) {
      var rows = []
      var lines = raw.split(NL).map(function (l) { return l.trim() }).filter(Boolean)
      for (var i = 0; i < lines.length; i++) {
        var idx = lines[i].indexOf('|')
        if (idx === -1) { toast(label + '第 ' + (i + 1) + ' 行缺少竖线 | 分隔', true); return null }
        var row = {}
        row[kName] = lines[i].slice(0, idx).trim()
        row[vName] = lines[i].slice(idx + 1).trim()
        rows.push(row)
      }
      return rows
    }
    var field = function (label, id, val, type) {
      return '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">' + label +
        '<input id="' + id + '" type="text" value="' + esc(String(val ?? '')) + '" class="mt-1 w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + ' /></label>'
    }
    // 标签页分区：站点设置字段太多，一屏铺开分不清哪个参数属于哪一块，
    // 按用途切成 4 个标签页。注意四个面板共用同一份 PUT（全量提交），
    // 所以无论点哪个标签页里的保存按钮，落盘的都是全部字段 —— 切页不丢数据。
    var TAB_DEFS = [
      ['basic', '基本信息'],
      ['copy', '文案与友链'],
      ['about', '关于页'],
      ['nav', '导航菜单'],
    ]
    // 保存按钮放进每个标签页的卡片内部（不再用页面底部悬浮条）
    var saveRow = readOnly ? '' : '<div class="mt-5 flex justify-end border-t border-[#f0f0f2] pt-4">' +
      '<button type="button" class="site-save rounded-full bg-[#1d1d1f] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-85">保存站点设置</button>' +
    '</div>'
    view.innerHTML = pageHead({
      title: '站点设置',
      desc: '按标签页分区，改完点该标签页里的「保存站点设置」。四个标签页是同一份配置，一次保存全部字段，切页不会丢改动。本地博客即时生效（dev HMR），线上随下次发布上线',
    }) +
      (readOnly ? '<p class="mb-4 rounded-lg bg-[#fdf6ec] px-4 py-2.5 text-[13px] text-[#8a6d1a]">当前身份只读，站点设置仅管理员/编辑可修改</p>' : '') +
      '<div class="mb-4 flex flex-wrap items-center gap-2">' +
        TAB_DEFS.map(function (t) {
          return '<button type="button" class="site-tab shrink-0 rounded-full border bg-white px-4 py-1.5 text-[13px] transition-colors" data-tab="' + t[0] + '">' + t[1] + '</button>'
        }).join('') +
        '<span id="sMsg" class="ml-auto text-[13px] text-[#1d7a35]"></span>' +
      '</div>' +
      '<div class="site-panel" data-panel="basic">' +
        '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
          '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">站点信息</p>' +
          '<p class="mb-1 text-[11.5px] leading-relaxed text-[#a1a1a6]">站名出现在侧栏与页脚品牌位；完整站名与 SEO 描述用于搜索结果与分享卡片；署名、邮箱、备案号显示在页脚</p>' +
          '<div class="grid gap-x-4 lg:grid-cols-2">' +
            field('站名（侧栏/页脚品牌）', 'sName', s.name) +
            field('完整站名（SEO）', 'sFullName', s.fullName) +
            field('副标题', 'sTagline', s.tagline) +
            field('SEO 描述', 'sDesc', s.description) +
            field('站长署名', 'sAuthor', s.author) +
            field('邮箱', 'sEmail', s.email) +
            field('备案号', 'sIcp', s.icp) +
          '</div>' +
          saveRow +
        '</div>' +
      '</div>' +
      '<div class="site-panel" data-panel="copy" style="display:none">' +
        '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
          '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">展示文案</p>' +
          '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">侧栏「关于本站」文案' +
            '<textarea id="sAbout" rows="2" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(s.about) + '</textarea></label>' +
          '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">页脚描述（副标题下一行）' +
            '<textarea id="sFooterDesc" rows="2" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(s.footerDesc) + '</textarea></label>' +
          '<p class="mt-5 border-t border-[#f0f0f2] pt-4 text-[13px] font-semibold text-[#6e6e73]">友情链接（页脚）</p>' +
          '<div id="flRows"></div>' +
          (readOnly ? '' : '<button id="flAdd" type="button" class="mt-2 rounded-full border border-[#d2d2d7] px-4 py-1.5 text-[12.5px] hover:border-[#0071e3] hover:text-[#0071e3]">＋ 添加友链</button>') +
          saveRow +
        '</div>' +
      '</div>' +
      '<div class="site-panel" data-panel="about" style="display:none">' +
        '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
          '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">关于页内容（前台「关于博客」页）</p>' +
          '<p class="mb-3 text-[11.5px] leading-relaxed text-[#a1a1a6]">介绍支持占位符：{{fullName}} 完整站名、{{tagline}} 副标题、{{count}} 文章数。技术栈/大事记每行一条，用竖线 | 分隔两列</p>' +
          '<label class="block text-[12.5px] text-[#6e6e73]">介绍段落' +
            '<textarea id="sAbIntro" rows="3" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(abPage.intro) + '</textarea></label>' +
          '<div class="mt-3 grid gap-3 lg:grid-cols-2">' +
            '<label class="block text-[12.5px] text-[#6e6e73]">技术栈（每行：名称 | 作用）' +
              '<textarea id="sAbStack" rows="7" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(abPage.techStack.map(function (t) { return t.name + ' | ' + t.role }).join(NL)) + '</textarea></label>' +
            '<label class="block text-[12.5px] text-[#6e6e73]">大事记（每行：日期 | 事件）' +
              '<textarea id="sAbMiles" rows="7" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(abPage.milestones.map(function (m) { return m.date + ' | ' + m.text }).join(NL)) + '</textarea></label>' +
          '</div>' +
          saveRow +
        '</div>' +
      '</div>' +
      '<div class="site-panel" data-panel="nav" style="display:none">' +
        '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
          '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">导航菜单（web + H5 全通用）</p>' +
          '<p class="mb-2 text-[11.5px] leading-relaxed text-[#a1a1a6]">同一份列表同时作用于电脑端顶栏与手机端抽屉，改一次两端都变。「页面」=站内页（内置 5 页 + 已发布的自定义页面）；「外链」=http(s):// 或 / 开头；「占位」=未上线不可点；「隐藏」=整枝都不出现（配置保留不删）。支持多级子菜单（最多 5 级）：选中的一行点 ⇥ 降为上一项的子菜单、⇤ 升回一级，子项跟着父项整体缩进；按住 ⠿ 拖动时整块子树一起搬。保存后顶栏是点击展开的下拉、手机抽屉是折叠组。松手后点下方「保存站点设置」生效</p>' +
          '<div id="navRows"></div>' +
          (readOnly ? '' : '<button id="navAdd" type="button" class="mt-2 rounded-full border border-[#d2d2d7] px-4 py-1.5 text-[12.5px] hover:border-[#0071e3] hover:text-[#0071e3]">＋ 添加菜单项</button>') +
          saveRow +
        '</div>' +
      '</div>'

    // 标签页切换：只切显示，DOM 全部保留 —— 隐藏面板里的输入值照样参与保存
    var tabsWrap = view.querySelectorAll('.site-tab')
    var panels = view.querySelectorAll('.site-panel')
    function showTab(id) {
      for (var i = 0; i < tabsWrap.length; i++) {
        var on = tabsWrap[i].getAttribute('data-tab') === id
        tabsWrap[i].style.background = on ? '#1d1d1f' : '#ffffff'
        tabsWrap[i].style.color = on ? '#ffffff' : '#1d1d1f'
        tabsWrap[i].style.borderColor = on ? '#1d1d1f' : '#d2d2d7'
      }
      for (var j = 0; j < panels.length; j++) {
        panels[j].style.display = panels[j].getAttribute('data-panel') === id ? '' : 'none'
      }
    }
    for (var ti = 0; ti < tabsWrap.length; ti++) {
      tabsWrap[ti].addEventListener('click', function () {
        showTab(this.getAttribute('data-tab'))
        if (window.scrollTo) window.scrollTo(0, 0)
      })
    }
    showTab('basic')

    // 友链动态行（增删改查）
    var flRows = $('flRows')
    function flRow(label, href) {
      var row = document.createElement('div')
      row.className = 'mt-2 flex items-center gap-2'
      row.innerHTML = '<input placeholder="名称" value="' + esc(label) + '" class="fl-label w-full rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" />' +
        '<input placeholder="https:// 地址" value="' + esc(href) + '" class="fl-href w-full rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" />' +
        '<button type="button" class="fl-del shrink-0 rounded-full px-2 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdf0ef]">删除</button>'
      row.querySelector('.fl-del').addEventListener('click', function () { row.remove() })
      flRows.appendChild(row)
    }
    d.site.friendLinks.forEach(function (l) { flRow(l.label, l.href) })
    if (!readOnly) {
      $('flAdd').addEventListener('click', function () { flRow('', '') })
    }

    // 导航菜单动态行（web 顶栏与 H5 抽屉同源，增删改查）
    var navRows = $('navRows')
    var dragRow = null // 正在被拖动的行
    var navOrderNoted = false // 拖动提示只提示一次，避免反复刷屏
    function noteNavReordered() {
      if (navOrderNoted) return
      navOrderNoted = true
      var msgEl = $('sMsg')
      if (msgEl) msgEl.textContent = '菜单顺序已调整 —— 点下方「保存站点设置」生效'
    }
    function navRow(box, it, depth) {
      it = it || {}
      depth = depth || 0
      var row = document.createElement('div')
      // 行容器：浅灰圆角卡片，字段与按钮都在卡内，归属清晰
      row.className = 'nav-row mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2.5'
      row.dataset.depth = String(depth)
      var routeOptions = '<option value="home">home · 首页</option><option value="archive">archive · 归档</option><option value="tags">tags · 标签</option><option value="about">about · 关于</option><option value="random">random · 随便看看</option>' +
        publishedPages.map(function (p) { return '<option value="' + esc(p.slug) + '">' + esc(p.slug) + ' · ' + esc(p.title) + '</option>' }).join('')
      row.innerHTML = '<span class="nv-depth-tag shrink-0 text-[11px] leading-none text-[#a1a1a6]" style="width:34px"></span>' +
        '<input class="nv-icon w-12 shrink-0 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-center text-[14px] outline-none focus:border-[#0071e3]" placeholder="图标" value="' + esc(it.icon || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        '<input class="nv-label w-28 shrink-0 rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" placeholder="名称" value="' + esc(it.label || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        '<select class="nv-kind shrink-0 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' +
          '<option value="route">页面</option><option value="external">外链</option><option value="disabled">占位</option><option value="hidden">隐藏</option>' +
        '</select>' +
        '<select class="nv-route min-w-[10rem] shrink-0 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + routeOptions + '</select>' +
        '<input class="nv-target min-w-[200px] flex-1 rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" value="' + esc(it.target || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        '<span class="nv-hint flex-1 text-[12.5px] text-[#a1a1a6]"></span>' +
        (readOnly ? '' :
          '<button type="button" class="nv-outdent shrink-0 rounded-full bg-white px-2 py-1 text-[13px] text-[#6e6e73] border border-[#d2d2d7] hover:border-[#0071e3] hover:text-[#0071e3]" title="提升一级（更靠左）">⇤</button>' +
          '<button type="button" class="nv-indent shrink-0 rounded-full bg-white px-2 py-1 text-[13px] text-[#6e6e73] border border-[#d2d2d7] hover:border-[#0071e3] hover:text-[#0071e3]" title="降为上一项的子菜单（更靠右）">⇥</button>') +
        '<button type="button" class="nv-del ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-[12px] text-[#c0392b] border border-[#f0d0d0] hover:bg-[#fdecec]">删除</button>'
      // 拖拽排序手柄：只有按住这个把手才能拖动整行。
      // 不把 draggable 挂到整行上 —— 行内含输入框，draggable 容器会吃掉浏览器
      // 原生的文本选择/拖选行为，用户就没法在输入框里划词了。
      var handle = document.createElement('span')
      handle.className = 'nv-drag shrink-0 select-none text-[15px] leading-none text-[#c7c7cc] hover:text-[#6e6e73]'
      handle.textContent = '⠿'
      handle.style.padding = '0 4px' // 内联，避免依赖 Tailwind 重编译
      if (readOnly) {
        handle.style.opacity = '0.3'
      } else {
        handle.draggable = true
        handle.style.cursor = 'grab'
        handle.title = '按住拖动调整顺序'
      }
      row.insertBefore(handle, row.firstChild)
      var kindSel = row.querySelector('.nv-kind')
      var routeSel = row.querySelector('.nv-route')
      var targetInp = row.querySelector('.nv-target')
      var hintEl = row.querySelector('.nv-hint')
      var delBtn = row.querySelector('.nv-del')
      // route 类型的合法 target：内置路由 + 已发布自定义页面（与后端白名单一致）
      var ROUTES = ['home', 'archive', 'tags', 'about', 'random'].concat(publishedPages.map(function (p) { return p.slug }))
      function syncTarget() {
        var k = kindSel.value
        // 页面 → 下拉选合法路由；外链 → 文本框；占位/隐藏 → 短提示语（不再拉伸大输入框）
        routeSel.style.display = k === 'route' ? '' : 'none'
        targetInp.style.display = k === 'external' ? '' : 'none'
        hintEl.style.display = k === 'disabled' || k === 'hidden' ? '' : 'none'
        targetInp.disabled = true // 只在 external 显示且可编辑
        if (k === 'external') targetInp.disabled = readOnly
        if (k === 'route') {
          var cur = targetInp.value.trim()
          routeSel.value = ROUTES.indexOf(cur) >= 0 ? cur : 'home'
        } else if (k === 'disabled') {
          hintEl.textContent = '未上线占位 —— 菜单里显示但不可点击，无需地址'
        } else if (k === 'hidden') {
          hintEl.textContent = '已隐藏 —— 不出现在任何菜单（配置保留不删）'
        }
      }
      kindSel.value = it.kind || 'disabled'
      syncTarget()
      kindSel.addEventListener('change', syncTarget)
      delBtn.addEventListener('click', function () { row.remove() })
      var outBtn = row.querySelector('.nv-outdent')
      var inBtn = row.querySelector('.nv-indent')
      if (!readOnly) {
        outBtn.addEventListener('click', function () { changeDepth(row, -1) })
        inBtn.addEventListener('click', function () { changeDepth(row, 1) })
      }
      applyIndent(row)
      if (!readOnly) {
        // 拖动开始：记住这一行，整行降透明度表示"正在搬运"
        handle.addEventListener('dragstart', function (e) {
          dragRow = row
          row.style.opacity = '0.4'
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            // Firefox 必须 setData 才会真正启动拖拽流程
            e.dataTransfer.setData('text/plain', 'nav-row')
          }
        })
        handle.addEventListener('dragend', function () {
          row.style.opacity = ''
          dragRow = null
          noteNavReordered()
        })
      }
      box.appendChild(row)
    }
    /* ---------------- 层级（多级子菜单） ----------------
     * 行按 DOM 顺序展平渲染，深度存每行 data-depth；保存时按深度栈重建树。
     * 缩进用内联 margin-left，不依赖 Tailwind 快照；⇥/⇤ 改深度时整块子树一起动。 */
    var NAV_INDENT = 26 // 每级缩进像素
    var NAV_MAX_DEPTH = 4 // 深度上限（0..4，共 5 级）
    function rowsInOrder() {
      return [].slice.call(navRows.querySelectorAll('.nav-row'))
    }
    function applyIndent(row) {
      var d = Number(row.dataset.depth || 0)
      row.style.marginLeft = (d * NAV_INDENT) + 'px'
      row.style.borderLeft = d > 0 ? '2px solid #d2d2d7' : ''
      var tag = row.querySelector('.nv-depth-tag')
      if (tag) tag.textContent = d > 0 ? '└' + (d + 1) + '级' : ''
    }
    function subtreeOf(row) {
      // 子树 = 这一行 + 其后所有深度更大的连续行
      var all = rowsInOrder()
      var i = all.indexOf(row)
      var block = [row]
      for (var k = i + 1; k < all.length; k++) {
        if (Number(all[k].dataset.depth) > Number(row.dataset.depth)) block.push(all[k])
        else break
      }
      return block
    }
    function changeDepth(row, delta) {
      var d = Number(row.dataset.depth || 0)
      var nd = d + delta
      if (nd < 0) { toast('已经是最上级了', true); return }
      if (nd > NAV_MAX_DEPTH) { toast('最多 ' + (NAV_MAX_DEPTH + 1) + ' 级菜单', true); return }
      if (delta > 0) {
        var all = rowsInOrder()
        var i = all.indexOf(row)
        if (i === 0) { toast('第一项不能降级', true); return }
        // 降为上一项的子菜单：新深度最多比上一行深一级
        if (Number(all[i - 1].dataset.depth) < d) { toast('上一项层级不够 —— 子菜单要挂在上一项名下', true); return }
      }
      subtreeOf(row).forEach(function (r) {
        r.dataset.depth = String(Number(r.dataset.depth) + delta)
        applyIndent(r)
      })
      noteNavReordered()
    }
    function flattenNav(list, depth) {
      var out = []
      ;(list || []).forEach(function (n) {
        out.push({ item: n, depth: depth })
        if (Array.isArray(n.children)) out = out.concat(flattenNav(n.children, depth + 1))
      })
      return out
    }
    var mainNavList = Array.isArray(d.site.mainNav) ? d.site.mainNav : []
    // 兼容旧配置：曾把「仅手机抽屉」的项单独存在 mobileExtraNav，这里合并进同一列表
    var legacyExtraList = Array.isArray(d.site.mobileExtraNav) ? d.site.mobileExtraNav : []
    flattenNav(mainNavList.concat(legacyExtraList), 0).forEach(function (e) { navRow(navRows, e.item, e.depth) })

    // 拖拽排序：手柄 dragstart 记下当前行 → dragover 按鼠标 Y 与各行中线比较，
    // 实时 insertBefore 到目标位置（所见即所得，松手即定）。
    // 拖的是整块子树：块内各行按原顺序一起插到目标位置，深度不变（升降级用 ⇥/⇤）。
    // 保存时 collectNav 按 DOM 顺序 + data-depth 重建树，顺序不需要额外存储。
    navRows.addEventListener('dragover', function (e) {
      if (!dragRow) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      var block = subtreeOf(dragRow)
      var others = rowsInOrder().filter(function (r) { return block.indexOf(r) < 0 })
      var next = null
      for (var i = 0; i < others.length; i++) {
        var rect = others[i].getBoundingClientRect()
        if (e.clientY < rect.top + rect.height / 2) { next = others[i]; break }
      }
      for (var j = 0; j < block.length; j++) navRows.insertBefore(block[j], next) // next 为 null 时等价 appendChild
    })
    navRows.addEventListener('drop', function (e) { e.preventDefault() })
    function collectNav(box) {
      // 按 DOM 顺序 + 每行深度重建树：slots[d] 是最近一个深度为 d 的节点的 children
      var rows = [].slice.call(box.querySelectorAll('.nav-row'))
      var roots = []
      var slots = []
      var prevD = -1
      var first = true
      rows.forEach(function (row) {
        var d = Number(row.dataset.depth || 0)
        var label = row.querySelector('.nv-label').value.trim()
        if (!label) return // 空名称行照旧丢弃
        if (first) {
          if (d !== 0) throw new Error('第一项菜单不能是子菜单 —— 先点 ⇤ 升回一级')
          first = false
        }
        if (d > prevD + 1) throw new Error('「' + label + '」跳级了 —— 子菜单要一级一级往下挂')
        var tSel = row.querySelector('.nv-route')
        var tInp = row.querySelector('.nv-target')
        var node = {
          icon: row.querySelector('.nv-icon').value.trim(),
          label: label,
          kind: row.querySelector('.nv-kind').value,
          target: tSel.style.display !== 'none' ? tSel.value : tInp.value.trim(),
        }
        if (d === 0) roots.push(node)
        else slots[d - 1].push(node)
        slots[d] = node.children = []
        prevD = d
      })
      return roots
    }
    if (!readOnly) {
      $('navAdd').addEventListener('click', function () { navRow(navRows, { kind: 'route' }) })
    }

    if (!readOnly) {
      // 四个标签页各有一个保存按钮，共用同一份提交逻辑（全量 PUT）
      var saveBtns = view.querySelectorAll('.site-save')
      function saveSite() {
        var links = [].slice.call(flRows.querySelectorAll('.fl-label')).map(function (inp, i) {
          var hrefInp = flRows.querySelectorAll('.fl-href')[i]
          return { label: inp.value.trim(), href: hrefInp.value.trim() }
        }).filter(function (l) { return l.label || l.href })
        var abStack = parseRows($('sAbStack').value, '技术栈', 'name', 'role')
        if (!abStack) return
        var abMiles = parseRows($('sAbMiles').value, '大事记', 'date', 'text')
        if (!abMiles) return
        var navTree
        try {
          navTree = collectNav(navRows)
        } catch (navErr) {
          toast(navErr.message, true)
          return
        }
        api('/api/site', {
          method: 'PUT',
          body: {
            name: $('sName').value.trim(), fullName: $('sFullName').value.trim(),
            tagline: $('sTagline').value.trim(), description: $('sDesc').value.trim(),
            author: $('sAuthor').value.trim(), email: $('sEmail').value.trim(),
            icp: $('sIcp').value.trim(), about: $('sAbout').value.trim(),
            footerDesc: $('sFooterDesc').value.trim(), friendLinks: links,
            mainNav: navTree,
            aboutPage: { intro: $('sAbIntro').value.trim(), techStack: abStack, milestones: abMiles },
          },
        }).then(function () {
          navOrderNoted = false // 已落盘，下次拖动重新提示
          $('sMsg').textContent = '已保存 ✓ 本地博客已即时生效'
          toast('站点设置已保存')
        }).catch(function (e) {
          $('sMsg').textContent = ''
          toast(e.message, true)
        })
      }
      for (var bi = 0; bi < saveBtns.length; bi++) saveBtns[bi].addEventListener('click', saveSite)
    }
  }).catch(function (e) {
    view.innerHTML = '<p class="text-sm text-[#c0392b]">' + esc(e.message) + '</p>'
  })
})

/* ================= 视图：系统设置（后台行为配置，存 content/site.json） ================= */
onRoute('settings', function () {
  var seq = viewSeq
  view.className = 'w-full' // 与全局统一：占满不留白
  var readOnly = myRole !== 'admin' && myRole !== 'editor'
  api('/api/site').then(function (d) {
    if (seq !== viewSeq) return
    var pg = (d.site && d.site.pagination) || {}
    var cfgSizes = Array.isArray(pg.sizes) && pg.sizes.length ? pg.sizes : [5, 10, 20, 50]
    var cfgDefault = pg.defaultSize || 10
    var CANDIDATES = [5, 10, 20, 50, 100] // 可勾选的档位候选
    view.innerHTML = pageHead({ title: '系统设置', desc: '后台界面的行为配置，保存后所有电脑打开后台都生效（不再依赖浏览器本地记忆）' }) +
      (readOnly ? '<p class="mb-4 rounded-lg bg-[#fdf6ec] px-4 py-2.5 text-[13px] text-[#8a6d1a]">当前身份只读，系统设置仅管理员/编辑可修改</p>' : '') +
      '<div class="w-full rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">文章列表翻页</p>' +
        '<p class="mb-3 text-[11.5px] leading-relaxed text-[#a1a1a6]">勾选翻页条「每页条数」下拉可提供的档位；默认条数必须是已勾选档位之一。配置存在 site.json 里，换电脑、换浏览器都一致</p>' +
        '<div id="pgSizes" class="flex flex-wrap items-center gap-2">' +
          CANDIDATES.map(function (n) {
            return '<label class="pg-chip flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-[13px] text-[#1d1d1f] transition-colors"><input type="checkbox" class="pg-size accent-[#0071e3]" value="' + n + '"' + (cfgSizes.includes(n) ? ' checked' : '') + (readOnly ? ' disabled' : '') + ' />' + n + ' 条/页</label>'
          }).join('') +
        '</div>' +
        '<label class="mt-4 block text-[12.5px] text-[#6e6e73]">默认每页条数' +
          '<select id="pgDefault" class="mt-1 w-44 rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '></select>' +
        '</label>' +
        (readOnly ? '' : '<div class="mt-4 flex items-center gap-3 border-t border-black/5 pt-4">' +
          '<span id="pgMsg" class="text-[13px] text-[#1d7a35]"></span>' +
          '<button id="pgSave" class="ml-auto rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-85">保存翻页设置</button>' +
        '</div>') +
      '</div>' +
      '<div class="mt-5 w-full rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">Git 推送配置</p>' +
        '<p class="mb-4 text-[11.5px] leading-relaxed text-[#a1a1a6]">提交身份存本机 git.config.local、推送凭证存本机凭证库，均不上传 GitHub，保存后本机立即生效；换电脑克隆后 npm run dev 自动生成，凭证在后台粘贴一次即可</p>' +
        '<div class="rounded-xl border border-black/5 bg-[#f5f5f7] p-4">' +
          '<p class="mb-3 text-[12px] font-semibold text-[#1d1d1f]">提交身份</p>' +
          '<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">' +
            '<label class="block text-[12px] text-[#6e6e73]">用户名' +
              '<input id="gitName" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" placeholder="如 WillowEcho"' + (myRole !== 'admin' ? ' disabled' : '') + ' />' +
            '</label>' +
            '<label class="block text-[12px] text-[#6e6e73]">邮箱' +
              '<input id="gitEmail" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" placeholder="如 willowecho@163.com"' + (myRole !== 'admin' ? ' disabled' : '') + ' />' +
            '</label>' +
            '<label class="block text-[12px] text-[#6e6e73]">网络协议（推送抖动时选 HTTP/1.1）' +
              '<select id="gitHttp" class="mt-1 w-full rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"' + (myRole !== 'admin' ? ' disabled' : '') + '>' +
                '<option value="HTTP/1.1">HTTP/1.1（稳定，推荐）</option>' +
                '<option value="HTTP/2">HTTP/2（更快，偶发 TLS 抖动）</option>' +
              '</select>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="mt-3 rounded-xl border border-black/5 bg-[#f5f5f7] p-4">' +
          '<div class="mb-3 flex flex-wrap items-center gap-2">' +
            '<p class="text-[12px] font-semibold text-[#1d1d1f]">GitHub 推送凭证（PAT）</p>' +
            '<span id="gitCredBadge" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"></span>' +
          '</div>' +
          '<p class="mb-3 text-[11.5px] leading-relaxed text-[#a1a1a6]">填一次推送全程免输；Token 保存后不可查看，只能替换。获取：GitHub → Settings → Developer settings → Personal access tokens（授权本仓库 Contents 读写）</p>' +
          '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">' +
            '<label class="block text-[12px] text-[#6e6e73]">账号名（留空自动取远程地址）' +
              '<input id="gitUser" type="text" class="mt-1 w-full rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" placeholder="如 769863269"' + (myRole !== 'admin' ? ' disabled' : '') + ' />' +
            '</label>' +
            '<label class="block text-[12px] text-[#6e6e73]">Token（留空保持不变）' +
              '<input id="gitToken" type="password" autocomplete="off" class="mt-1 w-full rounded-lg border border-[#d2d2d7] bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]" placeholder="粘贴 PAT（ghp_ / github_pat_ 开头）"' + (myRole !== 'admin' ? ' disabled' : '') + ' />' +
            '</label>' +
          '</div>' +
          (myRole !== 'admin' ? '' : '<style>@keyframes wfy-spin{to{transform:rotate(360deg)}}.wfy-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(0,113,227,.25);border-top-color:#0071e3;border-radius:50%;animation:wfy-spin .7s linear infinite}@keyframes wfy-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}.wfy-in{animation:wfy-in .25s ease-out both}@keyframes wfy-shake{0%,100%{transform:none}20%{transform:translateX(-3px)}60%{transform:translateX(3px)}}.wfy-shake{animation:wfy-shake .3s ease-in-out}</style>' +
          '<div class="mt-3 flex flex-wrap items-center gap-3">' +
            '<button id="gitVerify" class="inline-flex min-w-[9.5rem] items-center justify-center gap-1.5 rounded-full border border-[#0071e3] px-4 py-1.5 text-[12.5px] font-medium text-[#0071e3] transition-all hover:bg-[#0071e3]/5">测试凭证是否可用</button>' +
            '<span id="gitVerifyMsg" class="text-[12.5px] text-[#6e6e73]"></span>' +
          '</div>') +
        '</div>' +
        (myRole !== 'admin' ? '<p class="mt-3 text-[12px] text-[#a1a1a6]">Git 配置仅管理员可修改</p>' : '<div class="mt-4 flex items-center gap-3 border-t border-black/5 pt-4">' +
          '<span id="gitMsg" class="text-[13px] text-[#1d7a35]"></span>' +
          '<button id="gitSave" class="ml-auto rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-85">保存 Git 配置</button>' +
        '</div>') +
      '</div>'

    // 默认条数下拉 = 当前勾选的档位；勾选变化时重建
    function syncChips() {
      [].slice.call(document.querySelectorAll('.pg-chip')).forEach(function (lab) {
        var on = lab.querySelector('.pg-size').checked
        if (on) { lab.classList.add('border-[#0071e3]', 'bg-[#0071e3]/5', 'font-medium'); lab.classList.remove('border-[#d2d2d7]', 'bg-white') }
        else { lab.classList.remove('border-[#0071e3]', 'bg-[#0071e3]/5', 'font-medium'); lab.classList.add('border-[#d2d2d7]', 'bg-white') }
      })
    }
    function rebuildDefault() {
      var sel = $('pgDefault')
      var checked = [].slice.call(document.querySelectorAll('.pg-size:checked')).map(function (c) { return Number(c.value) })
      if (!checked.length) { sel.innerHTML = '<option value="">（先勾选档位）</option>'; return }
      var cur = Number(sel.value) || cfgDefault
      sel.innerHTML = checked.map(function (n) {
        return '<option value="' + n + '"' + (n === cur ? ' selected' : '') + '>' + n + ' 条/页</option>'
      }).join('')
    }
    rebuildDefault()
    syncChips()
    if (!readOnly) {
      [].slice.call(document.querySelectorAll('.pg-size')).forEach(function (c) {
        c.addEventListener('change', function () { rebuildDefault(); syncChips() })
      })
      $('pgSave').addEventListener('click', function () {
        var checked = [].slice.call(document.querySelectorAll('.pg-size:checked')).map(function (c) { return Number(c.value) })
        var def = Number($('pgDefault').value)
        if (!checked.length) { toast('至少勾选一个每页条数档位', true); return }
        if (!checked.includes(def)) { toast('默认条数必须是已勾选的档位之一', true); return }
        api('/api/site', { method: 'PUT', body: { pagination: { sizes: checked, defaultSize: def } } })
          .then(function () {
            $('pgMsg').textContent = '已保存 ✓ 所有电脑的后台即刻生效'
            toast('系统设置已保存')
            loadMeta()
          })
          .catch(function (e) {
            $('pgMsg').textContent = ''
            toast(e.message, true)
          })
      })
    }

    // Git 推送配置：回填当前值（file 优先，实际生效值兜底；凭证只显示状态不回显）
    function renderCredBadge(hasToken) {
      var b = $('gitCredBadge')
      if (hasToken) {
        b.className = 'inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-[11px] font-medium text-[#1d7a35]'
        b.innerHTML = '<span class="h-1.5 w-1.5 rounded-full bg-[#1d7a35]"></span>已配置'
      } else {
        b.className = 'inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#a1a1a6]'
        b.innerHTML = '<span class="h-1.5 w-1.5 rounded-full bg-[#a1a1a6]"></span>未配置'
      }
    }
    // git 生效值是子进程读的（本机约 2 秒），先给个加载提示；服务端有 30 秒缓存 +
    // 后台刷新，所以第二次及以后进这个页面是瞬时的。页面本身早已渲染完，不等它。
    if ($('gitMsg')) $('gitMsg').textContent = '正在读取本机 git 配置…'
    api('/api/git-config').then(function (g) {
      if (seq !== viewSeq) return
      var f = (g && g.file) || {}
      var live = (g && g.live) || {}
      var cred = (g && g.cred) || {}
      $('gitName').value = f['user.name'] || live['user.name'] || ''
      $('gitEmail').value = f['user.email'] || live['user.email'] || ''
      $('gitHttp').value = f['http.version'] || live['http.version'] || 'HTTP/1.1'
      $('gitUser').value = cred.username || f['github.username'] || ''
      renderCredBadge(!!cred.hasToken)
      if (cred.hasToken) $('gitToken').placeholder = '已配置，留空保持不变'
      if ($('gitMsg')) $('gitMsg').textContent = ''
    }).catch(function () { if ($('gitMsg')) $('gitMsg').textContent = '' })
    if (myRole === 'admin') {
      var verifying = false
      $('gitVerify').addEventListener('click', function () {
        var btn = $('gitVerify')
        if (verifying) return // 测试进行中，忽略重复点击
        verifying = true
        btn.disabled = true
        btn.classList.add('opacity-70', 'cursor-not-allowed')
        btn.innerHTML = '<span class="wfy-spin"></span><span>测试中…</span>'
        $('gitVerifyMsg').textContent = ''
        api('/api/git-config/verify', { method: 'POST', body: {} }).then(function (r) {
          var msg = $('gitVerifyMsg')
          msg.innerHTML = '<span class="wfy-in' + (r.ok ? '' : ' wfy-shake') + '">' + (r.ok ? '✓ ' : '✗ ') + r.message + '</span>'
          msg.className = 'text-[12.5px] ' + (r.ok ? 'text-[#1d7a35]' : 'text-[#d70015]')
        }).catch(function (e) {
          var msg = $('gitVerifyMsg')
          msg.innerHTML = '<span class="wfy-in wfy-shake">✗ ' + e.message + '</span>'
          msg.className = 'text-[12.5px] text-[#d70015]'
        }).then(function () {
          verifying = false
          btn.disabled = false
          btn.classList.remove('opacity-70', 'cursor-not-allowed')
          btn.innerHTML = '测试凭证是否可用'
        })
      })
      $('gitSave').addEventListener('click', function () {
        var name = $('gitName').value.trim()
        var email = $('gitEmail').value.trim()
        if (!name || !email) { toast('提交用户名和邮箱不能为空', true); return }
        // 邮箱校验：必须含 @，@ 后至少一个点且点不在结尾（避免正则转义在本文件的解析歧义）
        var at = email.indexOf('@')
        var dot = email.lastIndexOf('.')
        if (at < 1 || dot < at + 2 || dot >= email.length - 1) { toast('邮箱格式不对', true); return }
        var token = $('gitToken').value.trim()
        var hasWs = token.split('').some(function (ch) { return ch <= ' ' }) // 含空格/制表/换行等空白
        if (token && (hasWs || token.length < 20)) { toast('Token 格式不对：不能含空格且长度至少 20 位', true); return }
        var body = { entries: {
          'user.name': name,
          'user.email': email,
          'http.version': $('gitHttp').value,
          'credential.helper': 'store',
        } }
        if (token) {
          body.githubToken = token
          body.githubUsername = $('gitUser').value.trim()
        }
        api('/api/git-config', { method: 'POST', body: body }).then(function () {
          $('gitToken').value = ''
          if (token) {
            renderCredBadge(true)
            $('gitToken').placeholder = '已配置，留空保持不变'
            $('gitVerifyMsg').textContent = ''
          }
          $('gitMsg').textContent = '已保存 ✓ 本机 git 配置即刻生效'
          toast('Git 配置已保存并生效')
        }).catch(function (e) {
          $('gitMsg').textContent = ''
          toast(e.message, true)
        })
      })
    }
  })
})

/* ================= 全局：编辑器脏状态 / Ctrl+S / 离开提醒 ================= */
var editDirty = false // 编辑器有未保存改动时为 true（Ctrl+S 与离开提醒共用）
window.addEventListener('beforeunload', function (e) {
  if (editDirty) { e.preventDefault(); e.returnValue = '' }
})
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    var s = document.getElementById('eSave')
    if (s) {
      e.preventDefault()
      if (!s.disabled) s.click() // eSave 只在编辑器视图存在，其他视图按 Ctrl+S 无副作用
    }
  }
})

/* ================= 启动 ================= */
loadMeta().then(navigate)
</script>
</body>
</html>`
}
