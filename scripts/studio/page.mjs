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
  .nav-item.active { background:#e8f1fd; color:#0071e3; font-weight:600; }
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
      <div class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#3a8ffe] to-[#0071e3] text-[16px] font-bold text-white shadow-[0_3px_10px_rgba(0,113,227,0.35)]">风</div>
      <div>
        <div class="text-[15px] font-semibold leading-tight">晚风吟 CMS</div>
        <div class="text-[11px] text-[#86868b]">内容全生命周期管理</div>
      </div>
    </div>

    <nav id="nav" class="flex-1 space-y-0.5 overflow-y-auto">
      <p class="px-3 pb-1 pt-2 text-[11px] font-semibold text-[#a1a1a6]">内容管理</p>
      <a href="#/list/all"      data-nav="list/all"      class="nav-item flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]"><span>📋 全部文章</span><span data-count="all"      class="text-xs text-[#86868b]"></span></a>
      <a href="#/list/published" data-nav="list/published" class="nav-item flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]"><span>✅ 已发布</span><span data-count="published" class="text-xs text-[#86868b]"></span></a>
      <a href="#/list/draft"    data-nav="list/draft"    class="nav-item flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]"><span>📝 草稿</span><span data-count="draft"    class="text-xs text-[#86868b]"></span></a>
      <a href="#/list/review"   data-nav="list/review"   class="nav-item flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]"><span>👁 审核中</span><span data-count="review"   class="text-xs text-[#86868b]"></span></a>
      <a href="#/list/offline"  data-nav="list/offline"  class="nav-item flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]"><span>⏸ 已下线</span><span data-count="offline"  class="text-xs text-[#86868b]"></span></a>
      <p class="px-3 pb-1 pt-3 text-[11px] font-semibold text-[#a1a1a6]">系统</p>
      <a href="#/trash"    data-nav="trash"    class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">🗑 回收站</a>
      <a href="#/taxonomy" data-nav="taxonomy" class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">🏷 分类与标签</a>
      <a href="#/authors"  data-nav="authors"  class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">👥 作者与权限</a>
      <a href="#/logs"     data-nav="logs"     class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">📜 操作日志</a>
      <a href="#/site"     data-nav="site"     class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">⚙️ 站点设置</a>
      <a href="#/settings" data-nav="settings" class="nav-item flex items-center rounded-lg px-3 py-2 text-[13.5px] text-[#1d1d1f] hover:bg-[#f5f5f7]">🧩 系统设置</a>
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
  opts.headers = Object.assign({ 'x-studio-actor': encodeURIComponent(me) }, opts.headers || {})
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(opts.body)
  }
  return fetch(path, opts).then(function (r) { return r.json() })
    .then(function (d) {
      if (!d.ok) throw new Error(d.output || '操作失败')
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

/* ================= 元信息 ================= */
function loadMeta() {
  return api('/api/meta').then(function (d) {
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
      var el = document.querySelector('[data-count="' + k + '"]')
      if (el) el.textContent = d.counts[k] || ''
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
  })
}

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

function onRoute(pattern, fn) { routes[pattern] = fn }

function navigate() {
  var hash = location.hash.replace(/^#\\//, '') || 'list/all'
  document.querySelectorAll('.nav-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.nav === hash || (hash.indexOf('editor') === 0 && el.dataset.nav === 'list/all'))
  })
  var matched = null, arg = ''
  for (var key in routes) {
    if (hash === key) { matched = routes[key]; break }
    if (key.endsWith('/*') && hash.indexOf(key.slice(0, -2)) === 0) {
      matched = routes[key]; arg = hash.slice(key.length - 1); break
    }
  }
  viewSeq++
  view.className = 'mx-auto max-w-[1100px]' // 全视图统一宽度：居中 1100px，切菜单不再忽宽忽窄
  if (matched) matched(arg)
  else view.innerHTML = '<p class="text-sm text-[#86868b]">页面不存在</p>'
}
$('syncPanelClose').addEventListener('click', function () { $('syncPanel').classList.add('hidden') })
window.addEventListener('hashchange', navigate)

/* ================= 视图：文章列表 ================= */
var listState = { q: '', category: '', tag: '', sort: '', selected: new Set(), page: 1, pageSize: 0 }
var pageSizes = [5, 10, 20, 50] // 档位以后台「系统设置」为准，meta 加载后覆盖

onRoute('list/*', function (status) {
  status = status || 'all'
  var seq = viewSeq
  view.innerHTML =
    '<div class="mb-5 flex flex-wrap items-center justify-between gap-3">' +
      '<div><h2 class="text-[22px] font-semibold tracking-tight">文章管理</h2>' +
      '<p class="mt-0.5 text-[13px] text-[#86868b]">状态、置顶、推荐、分类、SEO、定时上下线，全在这里</p></div>' +
      '<a href="#/editor/new" class="rounded-full bg-[#0071e3] px-5 py-2 text-[13.5px] font-semibold text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)] hover:bg-[#0077ed]">＋ 写新文章</a>' +
    '</div>' +
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
      $('tbody').innerHTML = '<tr><td colspan="7" class="px-4 py-14 text-center text-sm text-[#a1a1a6]">这里空空如也</td></tr>'
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

    $('checkAll').addEventListener('change', function () {
      var on = $('checkAll').checked
      arts.forEach(function (a) { if (on) listState.selected.add(a.file); else listState.selected.delete(a.file) })
      document.querySelectorAll('.row-check').forEach(function (c) { c.checked = on })
      updateBatchBar()
    })
    document.querySelectorAll('.row-check').forEach(function (c) {
      c.addEventListener('change', function () {
        if (c.checked) listState.selected.add(c.dataset.check)
        else listState.selected.delete(c.dataset.check)
        updateBatchBar()
      })
    })
    document.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () { rowAction(btn.dataset.act, btn.dataset.file) })
    })
    document.querySelectorAll('[data-flag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.flag
        var patch = {}; patch[f] = btn.dataset.on !== 'true'
        api('/api/article/' + encodeURIComponent(btn.dataset.file) + '/flags', { method: 'POST', body: patch })
          .then(function () { toast(f === 'pinned' ? '置顶已更新' : '推荐已更新'); loadMeta(); renderRows(status) })
          .catch(function (e) { toast(e.message, true) })
      })
    })
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
      '<div class="mb-5 flex flex-wrap items-center justify-between gap-3">' +
        '<div class="flex items-center gap-3"><a href="#/list/all" class="rounded-full border border-[#d2d2d7] bg-white px-3.5 py-1.5 text-[12.5px] hover:bg-[#f5f5f7]">← 返回</a>' +
        '<h2 class="text-[20px] font-semibold tracking-tight">' + (isNew ? '写新文章' : '编辑文章') + '</h2>' +
        (isNew ? '' : '<span class="rounded-full px-2.5 py-1 text-[11.5px] font-medium ' + STATUS_STYLE[a.status] + '">' + STATUS_LABEL[a.status] + '</span>') +
        (a.status === 'published' ? '<a id="eViewBlog" href="' + BLOG_URL + '/post/' + encodeURIComponent(a.slug) + '" target="_blank" class="text-[12.5px] text-[#0071e3] hover:underline">在博客预览 ↗</a>' : '') + '</div>' +
      '</div>' +

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
              '<span id="eCoverBadge" class="absolute left-3 top-3 hidden rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"></span>' +
              '<div id="eCoverActions" class="absolute bottom-3 right-3 hidden gap-2">' +
                '<button id="eCoverSwap" class="rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] shadow-sm backdrop-blur transition-colors hover:bg-white">更换</button>' +
                '<button id="eCoverDel" class="rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-medium text-[#c0392b] shadow-sm backdrop-blur transition-colors hover:bg-[#fff5f4]">移除</button>' +
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

      '<div class="sticky bottom-4 z-10 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/95 px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)] backdrop-blur">' +
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
    document.addEventListener('paste', function (e) {
      if (seq !== viewSeq) return // 旧视图的监听直接作废
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
    })
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
            'link', 'table', 'code', 'inline-code', '|',
            'undo', 'redo', '|', 'edit-mode', 'fullscreen', 'export', '|', 'help',
          ],
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
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">回收站</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">删除的文章在这里，可恢复；彻底删除不可恢复（仅管理员）</p>' +
      '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[13.5px]"><tbody>' +
      (d.trash.length ? d.trash.map(function (t) {
        return '<tr class="border-b border-[#f0f0f2] last:border-0">' +
          '<td class="px-5 py-3.5"><div class="font-medium">' + esc(t.title) + '</div>' +
          '<div class="text-[11.5px] text-[#a1a1a6]">删除于 ' + esc(t.deletedAt.slice(0, 16).replace('T', ' ')) + ' · 由 ' + esc(t.deletedBy) + ' · 原状态：' + (STATUS_LABEL[t.status] || t.status) + '</div></td>' +
          '<td class="px-5 py-3.5 text-right"><div class="flex justify-end gap-2">' +
          '<button data-restore="' + esc(t.trashName) + '" class="rounded-full border border-[#0071e3] px-3.5 py-1 text-[12px] text-[#0071e3] hover:bg-[#e8f1fd]">恢复</button>' +
          (myRole === 'admin' ? '<button data-purge="' + esc(t.trashName) + '" class="rounded-full border border-[#f0d0d0] px-3.5 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdecec]">彻底删除</button>' : '') +
          '</div></td></tr>'
      }).join('') : '<tr><td class="px-5 py-14 text-center text-sm text-[#a1a1a6]">回收站是空的</td></tr>') +
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
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">分类与标签</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">重命名会全站同步更新所有文章</p>' +
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
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">作者与权限</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">本地工具无登录体系，身份用于操作授权与日志追溯（管理员 / 编辑 / 作者）</p>' +
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
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">操作日志</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">最近 ' + d.logs.length + ' 条，新到旧；jsonl 追加存储于 .studio/logs.jsonl</p>' +
      '<div class="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"><div class="overflow-x-auto"><table class="w-full text-left text-[12.5px]"><thead class="bg-[#fafafa] text-[11.5px] text-[#86868b]"><tr>' +
      '<th class="px-5 py-2.5">时间</th><th class="px-3 py-2.5">身份</th><th class="px-3 py-2.5">动作</th><th class="px-3 py-2.5">对象</th><th class="px-5 py-2.5">详情</th></tr></thead><tbody>' +
      (d.logs.length ? d.logs.map(function (l) {
        return '<tr class="border-t border-[#f0f0f2]">' +
          '<td class="whitespace-nowrap px-5 py-2.5 text-[#86868b]">' + esc(l.ts.slice(5, 16).replace('T', ' ')) + '</td>' +
          '<td class="px-3 py-2.5">' + esc(l.actor) + '</td>' +
          '<td class="px-3 py-2.5"><span class="rounded-full bg-[#f0f0f2] px-2 py-0.5 font-mono text-[11px]">' + esc(l.action) + '</span></td>' +
          '<td class="max-w-[220px] truncate px-3 py-2.5 font-mono text-[11.5px] xl:max-w-[420px]">' + esc(l.target) + '</td>' +
          '<td class="px-5 py-2.5 text-[#6e6e73]">' + esc(l.detail) + '</td></tr>'
      }).join('') : '<tr><td colspan="5" class="px-5 py-14 text-center text-sm text-[#a1a1a6]">还没有操作记录</td></tr>') +
      '</tbody></table></div></div>'
  }).catch(function (e) {
    view.innerHTML = '<p class="text-sm text-[#c0392b]">' + esc(e.message) + '</p>'
  })
})

/* ================= 视图：站点设置（content/site.json 增删改查） ================= */
onRoute('site', function () {
  view.className = 'mx-auto max-w-[1100px]' // 与全局统一宽度保持一致
  api('/api/site').then(function (d) {
    var s = d.site.site
    var readOnly = myRole !== 'admin' && myRole !== 'editor'
    var field = function (label, id, val, type) {
      return '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">' + label +
        '<input id="' + id + '" type="text" value="' + esc(String(val ?? '')) + '" class="mt-1 w-full rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + ' /></label>'
    }
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">站点设置</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">博客主页的站点文案与友情链接，保存后本地博客即时生效（dev HMR），线上随下次发布上线</p>' +
      (readOnly ? '<p class="mb-4 rounded-lg bg-[#fdf6ec] px-4 py-2.5 text-[13px] text-[#8a6d1a]">当前身份只读，站点设置仅管理员/编辑可修改</p>' : '') +
      '<div class="grid gap-5 lg:grid-cols-2">' +
        '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
          '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">站点信息</p>' +
          field('站名（侧栏/页脚品牌）', 'sName', s.name) +
          field('完整站名（SEO）', 'sFullName', s.fullName) +
          field('副标题', 'sTagline', s.tagline) +
          field('SEO 描述', 'sDesc', s.description) +
          field('站长署名', 'sAuthor', s.author) +
          field('邮箱', 'sEmail', s.email) +
          field('备案号', 'sIcp', s.icp) +
        '</div>' +
        '<div>' +
          '<div class="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">展示文案</p>' +
            '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">侧栏「关于本站」文案' +
              '<textarea id="sAbout" rows="2" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(s.about) + '</textarea></label>' +
            '<label class="mt-3 block text-[12.5px] text-[#6e6e73]">页脚描述（副标题下一行）' +
              '<textarea id="sFooterDesc" rows="2" class="mt-1 w-full resize-y rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' + esc(s.footerDesc) + '</textarea></label>' +
          '</div>' +
          '<div class="mt-5 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
            '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">友情链接（页脚）</p>' +
            '<div id="flRows"></div>' +
            (readOnly ? '' : '<button id="flAdd" type="button" class="mt-2 rounded-full border border-[#d2d2d7] px-4 py-1.5 text-[12.5px] hover:border-[#0071e3] hover:text-[#0071e3]">＋ 添加友链</button>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mt-5 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">顶部导航菜单（web 顶栏）</p>' +
        '<p class="mb-2 text-[11.5px] leading-relaxed text-[#a1a1a6]">「页面」=博客内页（首页/归档/标签/关于/随便看看）；「外链」=http(s):// 或 / 开头；「占位」=未上线不可点；「隐藏」=不出现在任何菜单（配置保留不删）。勾选 H5 = 同时出现在手机抽屉菜单</p>' +
        '<div id="navRows"></div>' +
        (readOnly ? '' : '<button id="navAdd" type="button" class="mt-2 rounded-full border border-[#d2d2d7] px-4 py-1.5 text-[12.5px] hover:border-[#0071e3] hover:text-[#0071e3]">＋ 添加菜单项</button>') +
      '</div>' +
      '<div class="mt-5 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">H5 抽屉额外入口（仅手机抽屉显示）</p>' +
        '<div id="mnavRows"></div>' +
        (readOnly ? '' : '<button id="mnavAdd" type="button" class="mt-2 rounded-full border border-[#d2d2d7] px-4 py-1.5 text-[12.5px] hover:border-[#0071e3] hover:text-[#0071e3]">＋ 添加抽屉入口</button>') +
      '</div>' +
      (readOnly ? '' : '<div class="sticky bottom-4 z-10 mt-5 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/95 px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)] backdrop-blur">' +
        '<span id="sMsg" class="text-[13px] text-[#1d7a35]"></span>' +
        '<button id="sSave" class="ml-auto rounded-full bg-[#1d1d1f] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-85">保存站点设置</button>' +
      '</div>')

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

    // 导航菜单动态行（web 顶栏 + H5 抽屉，增删改查）
    var navRows = $('navRows')
    var mnavRows = $('mnavRows')
    function navRow(box, it, showMobileToggle) {
      it = it || {}
      var row = document.createElement('div')
      row.className = 'nav-row mt-2 flex flex-wrap items-center gap-2'
      row.innerHTML = '<input class="nv-icon w-12 shrink-0 rounded-lg border border-[#d2d2d7] px-2 py-1.5 text-center text-[14px] outline-none focus:border-[#0071e3]" placeholder="图标" value="' + esc(it.icon || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        '<input class="nv-label w-28 shrink-0 rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" placeholder="名称" value="' + esc(it.label || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        '<select class="nv-kind shrink-0 rounded-lg border border-[#d2d2d7] px-2 py-1.5 text-[13px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '>' +
          '<option value="route">页面</option><option value="external">外链</option><option value="disabled">占位</option><option value="hidden">隐藏</option>' +
        '</select>' +
        '<input class="nv-target min-w-[160px] flex-1 rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0071e3]" value="' + esc(it.target || '') + '"' + (readOnly ? ' disabled' : '') + ' />' +
        (showMobileToggle ? '<label class="shrink-0 flex items-center gap-1 text-[12px] text-[#6e6e73]"><input type="checkbox" class="nv-mobile"' + (it.showOnMobile !== false ? ' checked' : '') + (readOnly ? ' disabled' : '') + ' />H5</label>' : '') +
        '<button type="button" class="nv-del shrink-0 rounded-full px-2 py-1 text-[12px] text-[#c0392b] hover:bg-[#fdf0ef]">删除</button>'
      var kindSel = row.querySelector('.nv-kind')
      var targetInp = row.querySelector('.nv-target')
      function syncTarget() {
        var k = kindSel.value
        targetInp.disabled = readOnly || k === 'disabled' || k === 'hidden'
        targetInp.placeholder = k === 'route' ? 'home / archive / tags / about / random'
          : k === 'external' ? 'https:// 或 /feed.xml'
          : k === 'hidden' ? '已隐藏，不出现在任何菜单' : '未上线，无需地址'
      }
      kindSel.value = it.kind || 'disabled'
      syncTarget()
      kindSel.addEventListener('change', syncTarget)
      row.querySelector('.nv-del').addEventListener('click', function () { row.remove() })
      box.appendChild(row)
    }
    var mainNavList = Array.isArray(d.site.mainNav) ? d.site.mainNav : []
    var extraNavList = Array.isArray(d.site.mobileExtraNav) ? d.site.mobileExtraNav : []
    mainNavList.forEach(function (n) { navRow(navRows, n, true) })
    extraNavList.forEach(function (n) { navRow(mnavRows, n, false) })
    function collectNav(box) {
      return [].slice.call(box.querySelectorAll('.nav-row')).map(function (row) {
        var mobileBox = row.querySelector('.nv-mobile')
        return {
          icon: row.querySelector('.nv-icon').value.trim(),
          label: row.querySelector('.nv-label').value.trim(),
          kind: row.querySelector('.nv-kind').value,
          target: row.querySelector('.nv-target').value.trim(),
          showOnMobile: mobileBox ? mobileBox.checked : true,
        }
      }).filter(function (n) { return n.label })
    }
    if (!readOnly) {
      $('navAdd').addEventListener('click', function () { navRow(navRows, { kind: 'route' }, true) })
      $('mnavAdd').addEventListener('click', function () { navRow(mnavRows, { kind: 'route' }, false) })
    }

    if (!readOnly) {
      $('sSave').addEventListener('click', function () {
        var links = [].slice.call(flRows.querySelectorAll('.fl-label')).map(function (inp, i) {
          var hrefInp = flRows.querySelectorAll('.fl-href')[i]
          return { label: inp.value.trim(), href: hrefInp.value.trim() }
        }).filter(function (l) { return l.label || l.href })
        api('/api/site', {
          method: 'PUT',
          body: {
            name: $('sName').value.trim(), fullName: $('sFullName').value.trim(),
            tagline: $('sTagline').value.trim(), description: $('sDesc').value.trim(),
            author: $('sAuthor').value.trim(), email: $('sEmail').value.trim(),
            icp: $('sIcp').value.trim(), about: $('sAbout').value.trim(),
            footerDesc: $('sFooterDesc').value.trim(), friendLinks: links,
            mainNav: collectNav(navRows), mobileExtraNav: collectNav(mnavRows),
          },
        }).then(function () {
          $('sMsg').textContent = '已保存 ✓ 本地博客已即时生效'
          toast('站点设置已保存')
        }).catch(function (e) {
          $('sMsg').textContent = ''
          toast(e.message, true)
        })
      })
    }
  }).catch(function (e) {
    view.innerHTML = '<p class="text-sm text-[#c0392b]">' + esc(e.message) + '</p>'
  })
})

/* ================= 视图：系统设置（后台行为配置，存 content/site.json） ================= */
onRoute('settings', function () {
  var seq = viewSeq
  view.className = 'mx-auto max-w-[1100px]' // 与全局统一宽度保持一致
  var readOnly = myRole !== 'admin' && myRole !== 'editor'
  api('/api/site').then(function (d) {
    if (seq !== viewSeq) return
    var pg = (d.site && d.site.pagination) || {}
    var cfgSizes = Array.isArray(pg.sizes) && pg.sizes.length ? pg.sizes : [5, 10, 20, 50]
    var cfgDefault = pg.defaultSize || 10
    var CANDIDATES = [5, 10, 20, 50, 100] // 可勾选的档位候选
    view.innerHTML = '<h2 class="mb-1 text-[22px] font-semibold tracking-tight">系统设置</h2>' +
      '<p class="mb-5 text-[13px] text-[#86868b]">后台界面的行为配置，保存后所有电脑打开后台都生效（不再依赖浏览器本地记忆）</p>' +
      (readOnly ? '<p class="mb-4 rounded-lg bg-[#fdf6ec] px-4 py-2.5 text-[13px] text-[#8a6d1a]">当前身份只读，系统设置仅管理员/编辑可修改</p>' : '') +
      '<div class="w-full rounded-2xl border border-black/5 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">' +
        '<p class="mb-1 text-[13px] font-semibold text-[#6e6e73]">文章列表翻页</p>' +
        '<p class="mb-3 text-[11.5px] leading-relaxed text-[#a1a1a6]">勾选翻页条「每页条数」下拉可提供的档位；默认条数必须是已勾选档位之一。配置存在 site.json 里，换电脑、换浏览器都一致</p>' +
        '<div id="pgSizes" class="flex flex-wrap items-center gap-x-5 gap-y-2">' +
          CANDIDATES.map(function (n) {
            return '<label class="flex items-center gap-1.5 text-[13.5px] text-[#1d1d1f]"><input type="checkbox" class="pg-size accent-[#0071e3]" value="' + n + '"' + (cfgSizes.includes(n) ? ' checked' : '') + (readOnly ? ' disabled' : '') + ' />' + n + ' 条/页</label>'
          }).join('') +
        '</div>' +
        '<label class="mt-4 block text-[12.5px] text-[#6e6e73]">默认每页条数' +
          '<select id="pgDefault" class="mt-1 w-40 rounded-lg border border-[#d2d2d7] px-2.5 py-2 text-[13.5px] outline-none focus:border-[#0071e3]"' + (readOnly ? ' disabled' : '') + '></select>' +
        '</label>' +
      '</div>' +
      (readOnly ? '' : '<div class="sticky bottom-4 z-10 mt-5 flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white/95 px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)] backdrop-blur">' +
        '<span id="pgMsg" class="text-[13px] text-[#1d7a35]"></span>' +
        '<button id="pgSave" class="ml-auto rounded-full bg-[#1d1d1f] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-85">保存系统设置</button>' +
      '</div>')

    // 默认条数下拉 = 当前勾选的档位；勾选变化时重建
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
    if (!readOnly) {
      [].slice.call(document.querySelectorAll('.pg-size')).forEach(function (c) {
        c.addEventListener('change', rebuildDefault)
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
