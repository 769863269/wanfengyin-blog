/**
 * 本地发布后台（晚风吟 Studio）
 *
 * 用法：npm run studio → 浏览器打开 http://127.0.0.1:5199/
 *
 * 在页面上填标题/标签/正文、传封面图，点「发布」即自动完成：
 * 写入 articles/*.md（规范命名）→ 保存图片到 public/images/covers/ →
 * 后台任务跑 scripts/publish.mjs 提交推送 → 前端实时轮询任务状态。
 *
 * 实时状态：POST /api/publish 立即返回 jobId，publish.mjs 以子进程运行，
 * stdout/stderr 逐行存入任务；GET /api/jobs/:id 返回快照，前端 700ms 轮询，
 * 步骤条 + 终端日志实时刷新。
 *
 * 样式：Tailwind CSS（scripts/studio-assets/tailwind.js 本地伺服，离线可用）。
 * 仅监听 127.0.0.1，运行时零外部依赖（Node 内置 http）。
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from './lib/markdown.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const articlesDir = join(root, 'articles')
const coversDir = join(root, 'public', 'images', 'covers')
const tailwindJs = readFileSync(join(root, 'scripts', 'studio-assets', 'tailwind.js'), 'utf8')
const PORT = 5199

/* ---------------- 工具 ---------------- */

function slugify(title) {
  const fromAscii = title
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.join('-')
  return fromAscii || `post-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`
}

function normalizeSlug(raw) {
  return (raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function slugExists(slug) {
  return readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .some((f) => {
      try {
        return readFileSync(join(articlesDir, f), 'utf8').match(/^slug:\s*(\S+)/m)?.[1] === slug
      } catch {
        return false
      }
    })
}

function listArticles() {
  return readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => {
      try {
        const { data } = parseFrontmatter(readFileSync(join(articlesDir, f), 'utf8'))
        return {
          file: f,
          title: data.title ?? f,
          slug: data.slug ?? '',
          date: data.publishedAt ?? '',
          tags: data.tags ?? [],
          cover: data.cover ?? '',
          excerpt: data.excerpt ?? '',
        }
      } catch {
        return { file: f, title: f, slug: '', date: '', tags: [], cover: '', excerpt: '' }
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

function writeArticle({ title, slug, tags, excerpt, date, cover, content }) {
  const fm = [
    '---',
    `slug: ${slug}`,
    `title: ${title}`,
    `excerpt: ${excerpt}`,
    `publishedAt: ${date}`,
    `tags: [${tags.join(', ')}]`,
    ...(cover ? [`cover: /images/covers/${cover}`] : []),
    'views: 0',
    'commentCount: 0',
    '---',
    '',
    content.trim(),
    '',
  ]
  const fileName = `${date}-${slug}.md`
  writeFileSync(join(articlesDir, fileName), fm.join('\n'), 'utf8')
  return fileName
}

/* ---------------- 发布任务（后台子进程 + 实时日志） ---------------- */

const jobs = new Map() // id → { id, status, lines, dryRun, slug, fileName, startedAt, endedAt }
const MAX_LINES = 300

function startPublishJob(message, dryRun, meta) {
  const id = randomUUID().replace(/-/g, '').slice(0, 10)
  const job = {
    id,
    status: 'running',
    lines: [],
    dryRun,
    slug: meta.slug,
    fileName: meta.fileName,
    startedAt: Date.now(),
    endedAt: null,
  }
  jobs.set(id, job)

  const args = ['scripts/publish.mjs', '--message', message]
  if (dryRun) args.push('--dry-run')
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env } })

  const onChunk = (buf) => {
    for (const raw of buf.toString('utf8').split('\n')) {
      const line = raw.trim()
      if (!line) continue
      job.lines.push(line)
      if (job.lines.length > MAX_LINES) job.lines.splice(0, job.lines.length - MAX_LINES)
    }
  }
  child.stdout.on('data', onChunk)
  child.stderr.on('data', onChunk)
  child.on('error', (err) => {
    job.lines.push(`[studio] 子进程启动失败：${err.message}`)
    job.status = 'error'
    job.endedAt = Date.now()
  })
  child.on('close', (code) => {
    job.status = code === 0 ? 'success' : 'error'
    job.endedAt = Date.now()
  })
  return id
}

/* ---------------- HTTP ---------------- */

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('请求体超过 12MB 限制'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(page())
      return
    }

    if (req.method === 'GET' && req.url === '/tailwind.js') {
      res.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      })
      res.end(tailwindJs)
      return
    }

    if (req.method === 'GET' && req.url === '/api/articles') {
      sendJson(res, 200, { ok: true, articles: listArticles() })
      return
    }

    if (req.method === 'POST' && req.url === '/api/publish') {
      const body = JSON.parse(await readBody(req))
      const title = (body.title || '').trim()
      const content = (body.content || '').trim()
      if (!title || !content) {
        sendJson(res, 400, { ok: false, output: '标题和正文都不能为空' })
        return
      }
      const slug = normalizeSlug(body.slug) || slugify(title)
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        sendJson(res, 400, { ok: false, output: `slug 不合法：${slug}（只允许小写字母、数字、中划线）` })
        return
      }
      if (slugExists(slug)) {
        sendJson(res, 400, { ok: false, output: `slug "${slug}" 已被使用，换一个` })
        return
      }
      const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : new Date().toISOString().slice(0, 10)
      const tags = (body.tags || '随笔')
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
      const fileName = writeArticle({
        title,
        slug,
        tags,
        excerpt: (body.excerpt || '').trim() || '（待补摘要）',
        date,
        cover: body.cover || '',
        content,
      })
      const dryRun = Boolean(body.dryRun)
      const jobId = startPublishJob(`post: ${title}`, dryRun, { slug, fileName })
      sendJson(res, 200, {
        ok: true,
        jobId,
        fileName,
        dryRun,
        liveUrl: dryRun ? null : `https://wanfengyin-blog.vercel.app/post/${slug}/`,
      })
      return
    }

    if (req.method === 'GET' && req.url.startsWith('/api/jobs/')) {
      const id = req.url.slice('/api/jobs/'.length)
      const job = jobs.get(id)
      if (!job) {
        sendJson(res, 404, { ok: false, output: '任务不存在' })
        return
      }
      sendJson(res, 200, { ok: true, ...job })
      return
    }

    if (req.method === 'POST' && req.url === '/api/upload') {
      const body = JSON.parse(await readBody(req))
      const ext = extname(body.name || '').toLowerCase()
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) {
        sendJson(res, 400, { ok: false, output: `不支持的图片格式：${ext}` })
        return
      }
      const base64 = String(body.dataBase64 || '').replace(/^data:[^;]+;base64,/, '')
      if (!base64) {
        sendJson(res, 400, { ok: false, output: '图片数据为空' })
        return
      }
      mkdirSync(coversDir, { recursive: true })
      const fileName = normalizeSlug(body.slug) || `cover-${Date.now()}`
      const fullName = `${fileName}${ext === '.jpeg' ? '.jpg' : ext}`
      writeFileSync(join(coversDir, fullName), Buffer.from(base64, 'base64'))
      sendJson(res, 200, { ok: true, fileName: fullName })
      return
    }

    sendJson(res, 404, { ok: false, output: 'not found' })
  } catch (err) {
    sendJson(res, 500, { ok: false, output: String(err.message || err) })
  }
})

/* ---------------- 页面（Tailwind CSS，苹果风） ---------------- */

function page() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>晚风吟 · 发布后台</title>
<script src="/tailwind.js"></script>
<style>
  body { font-family: -apple-system, "SF Pro Text", "Segoe UI", "Microsoft YaHei", sans-serif; }
  input[type=file]::file-selector-button {
    border: 0; border-radius: 980px; padding: 6px 16px; margin-right: 12px;
    background: #e8e8ed; color: #1d1d1f; font-size: 13px; cursor: pointer;
    transition: background .15s;
  }
  input[type=file]::file-selector-button:hover { background: #dcdce1; }
  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .step-line { transition: background-color .3s; }
  .fade-in { animation: fadein .25s ease-out; }
  @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
</style>
</head>
<body class="min-h-screen bg-[#f5f5f7] px-5 py-10 text-[#1d1d1f] antialiased">
<div class="mx-auto max-w-[880px]">

  <!-- 顶栏 -->
  <header class="mb-8 flex items-center justify-between">
    <div class="flex items-center gap-3.5">
      <div class="flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-b from-[#3a8ffe] to-[#0071e3] text-[20px] font-bold text-white shadow-[0_4px_12px_rgba(0,113,227,0.35)]">风</div>
      <div>
        <h1 class="text-[22px] font-semibold leading-tight tracking-tight">晚风吟 Studio</h1>
        <p class="text-[13px] text-[#6e6e73]">写文章 · 点发布 · 自动上线</p>
      </div>
    </div>
    <a href="http://127.0.0.1:5173/" target="_blank"
      class="rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-[13px] font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]">预览博客 ↗</a>
  </header>

  <!-- 编辑卡 -->
  <div class="mb-5 rounded-[20px] border border-black/5 bg-white px-8 py-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
    <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">标题 *</label>
    <input type="text" id="title" placeholder="文章标题"
      class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10" />

    <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">slug（网址名，留空自动生成）</label>
        <input type="text" id="slug" placeholder="my-first-post"
          class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10" />
        <p class="mt-1 text-xs text-[#86868b]">只允许小写字母、数字、中划线</p>
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">标签（逗号分隔）</label>
        <input type="text" id="tags" placeholder="前端, Vue"
          class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10" />
      </div>
    </div>

    <label class="mb-1.5 mt-5 block text-[13px] font-semibold text-[#6e6e73]">摘要（显示在列表和搜索里）</label>
    <textarea id="excerpt" rows="2" placeholder="一两句话说清这篇文章讲了什么"
      class="w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10"></textarea>

    <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_180px]">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">封面图（可选）</label>
        <div class="flex items-center gap-3.5">
          <input type="file" id="cover" accept="image/*" class="text-sm" />
          <div id="coverPreview" class="hidden h-[64px] w-28 shrink-0 rounded-[10px] bg-[#f5f5f7] bg-center bg-no-repeat [background-size:cover]"></div>
        </div>
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">发布日期</label>
        <input type="date" id="date"
          class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10" />
      </div>
    </div>

    <div class="mt-5 flex items-baseline justify-between">
      <label class="block text-[13px] font-semibold text-[#6e6e73]">正文（Markdown，## 是小节标题，\`\`\`ts 是代码块）*</label>
      <span id="wordCount" class="text-xs text-[#86868b]"></span>
    </div>
    <textarea id="content" placeholder="## 第一个小节

正文直接写 Markdown。"
      class="min-h-[300px] w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 font-mono text-[13.5px] leading-relaxed outline-none transition-all focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10"></textarea>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <button id="publish"
        class="flex items-center gap-2 rounded-full bg-[#0071e3] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)] transition-all hover:bg-[#0077ed] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
        <svg id="btnSpinner" class="spin hidden h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="3"/>
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <span id="btnText">发布</span>
      </button>
      <label class="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6e6e73]">
        <input type="checkbox" id="dryRun" class="accent-[#0071e3]" /> 预演（只生成文件，不推送）
      </label>
    </div>

    <!-- 发布状态面板 -->
    <div id="panel" class="fade-in mt-6 hidden rounded-[16px] border border-[#e8e8ed] bg-[#fafafa] p-5">
      <!-- 步骤条 -->
      <ol id="steps" class="mb-4 flex items-center"></ol>
      <!-- 终端日志 -->
      <pre id="log" class="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#1d1d1f] p-4 font-mono text-[12.5px] leading-relaxed text-[#7ee29a]"></pre>
      <!-- 结果横幅 -->
      <div id="banner" class="mt-4 hidden rounded-xl px-4 py-3 text-sm"></div>
    </div>
  </div>

  <!-- 已发布列表 -->
  <div class="rounded-[20px] border border-black/5 bg-white px-8 py-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
    <details open>
      <summary class="cursor-pointer text-[15px] font-semibold">已发布文章（<span id="artCount">…</span>）</summary>
      <ul id="artList" class="mt-2 list-none"></ul>
    </details>
  </div>

  <p class="mt-6 text-center text-xs text-[#a1a1a6]">仅本机可访问（127.0.0.1）· 推送到 GitHub 后由 Vercel 自动构建上线</p>
</div>

<script>
var $ = function (id) { return document.getElementById(id) }
$('date').value = new Date().toISOString().slice(0, 10)

/* 标题输入 → 自动建议 slug */
$('title').addEventListener('input', function () {
  var s = $('title').value.toLowerCase().match(/[a-z0-9]+/g)
  $('slug').placeholder = s ? s.join('-') : 'post-' + new Date().toISOString().slice(0, 10).replaceAll('-', '')
})

/* 正文字数统计 */
$('content').addEventListener('input', function () {
  var n = $('content').value.trim().length
  $('wordCount').textContent = n ? n + ' 字' : ''
})

/* 封面图本地预览 */
var coverFile = null
$('cover').addEventListener('change', function () {
  coverFile = $('cover').files[0] || null
  var p = $('coverPreview')
  if (!coverFile) { p.classList.add('hidden'); return }
  var reader = new FileReader()
  reader.onload = function () {
    p.style.backgroundImage = 'url(' + reader.result + ')'
    p.classList.remove('hidden')
  }
  reader.readAsDataURL(coverFile)
})

/* ---------- 已发布列表 ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function tagChips(tags) {
  return (tags || []).map(function (t) {
    return '<span class="rounded-full bg-[#f0f0f2] px-2.5 py-0.5 text-[11px] text-[#6e6e73]">' + esc(t) + '</span>'
  }).join('')
}

function artRow(a) {
  var link = 'https://wanfengyin-blog.vercel.app/post/' + encodeURIComponent(a.slug) + '/'
  return '<li class="flex items-center gap-3 border-b border-[#f0f0f2] py-3 text-sm last:border-0">' +
    (a.cover ? '<div class="h-9 w-16 shrink-0 rounded-md bg-[#f5f5f7] bg-center bg-no-repeat [background-size:cover]" style="background-image:url(' + esc(a.cover) + ')"></div>' : '') +
    '<span class="min-w-[86px] shrink-0 text-xs text-[#86868b]">' + esc(a.date) + '</span>' +
    '<span class="min-w-0 flex-1 truncate"><a href="' + link + '" target="_blank" class="hover:text-[#0071e3] hover:underline">' + esc(a.title) + '</a></span>' +
    '<span class="hidden shrink-0 gap-1.5 sm:flex">' + tagChips(a.tags) + '</span>' +
    '<span class="hidden shrink-0 text-xs text-[#a1a1a6] lg:inline">' + esc(a.slug) + '</span></li>'
}

function loadArticles() {
  return fetch('/api/articles').then(function (r) { return r.json() }).then(function (d) {
    $('artCount').textContent = d.articles.length + ' 篇'
    $('artList').innerHTML = d.articles.map(artRow).join('')
  })
}
loadArticles()

/* ---------- 发布：实时状态 ---------- */
var STEPS = [
  { key: 'write', label: '写入文章' },
  { key: 'check', label: '文件检查' },
  { key: 'commit', label: 'Git 提交' },
  { key: 'push', label: '推送上线' },
]

var pollTimer = null

function stepIcon(state) {
  if (state === 'done') return '<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-[12px] text-white">✓</span>'
  if (state === 'active') return '<span class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0071e3]"><span class="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]"></span></span>'
  if (state === 'skip') return '<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e8ed] text-[11px] text-[#86868b]">—</span>'
  return '<span class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#e8e8ed]"></span>'
}

function renderSteps(states, note) {
  var html = ''
  STEPS.forEach(function (s, i) {
    var color = states[i] === 'done' ? 'text-[#1d1d1f]' : states[i] === 'active' ? 'text-[#0071e3] font-medium' : 'text-[#a1a1a6]'
    html += '<li class="flex items-center gap-2">' + stepIcon(states[i]) +
      '<span class="whitespace-nowrap text-[13px] ' + color + '">' + s.label + '</span></li>'
    if (i < STEPS.length - 1) {
      var line = states[i] === 'done' ? 'bg-[#0071e3]' : 'bg-[#e8e8ed]'
      html += '<li class="step-line mx-2 h-0.5 flex-1 rounded ' + line + '"></li>'
    }
  })
  if (note) html += '<li class="ml-3 hidden whitespace-nowrap text-xs text-[#86868b] md:block">' + note + '</li>'
  $('steps').innerHTML = html
}

/* 根据日志推断各步骤状态 */
function computeStates(lines, dryRun, finished, ok) {
  var hasRename = lines.some(function (l) { return /改名/.test(l) })
  var pushing = lines.some(function (l) { return /推送中/.test(l) })
  var pushed = lines.some(function (l) { return /已推送/.test(l) })
  var dryExec = dryRun && lines.some(function (l) { return /将执行/.test(l) })
  var nothing = lines.some(function (l) { return /没有需要发布的变更/.test(l) })

  var write = 'done'
  var check = 'active'
  var commit = 'pending'
  var push = 'pending'

  if (hasRename || dryExec || pushing || pushed || nothing) check = 'done'
  if (dryExec) { commit = 'done'; push = 'skip' }
  if (pushing || pushed || nothing) commit = 'done'
  if (pushing && !pushed) push = 'active'
  if (pushed) push = 'done'
  if (finished && ok) {
    check = 'done'; commit = 'done'
    if (!dryRun) push = 'done'
    else push = 'skip'
  }
  if (finished && !ok) {
    // 失败时：已到达的步骤保留，当前步骤标红由终端颜色体现
    if (check !== 'done') check = 'done'
  }
  return [write, check, commit, push]
}

function pushAttempt(lines) {
  var m = null
  lines.forEach(function (l) {
    var hit = l.match(/推送中（第 (\\d+) 次）/)
    if (hit) m = hit[1]
  })
  return m
}

function scrollLog() {
  var el = $('log')
  el.scrollTop = el.scrollHeight
}

function setBusy(busy) {
  $('publish').disabled = busy
  $('btnSpinner').classList.toggle('hidden', !busy)
  $('btnText').textContent = busy ? '发布中' : '发布'
}

function showBanner(kind, html) {
  var b = $('banner')
  b.classList.remove('hidden', 'bg-[#e8f6ec]', 'text-[#1d7a35]', 'bg-[#eaf3ff]', 'text-[#0b62c4]', 'bg-[#fdecec]', 'text-[#c0392b]')
  if (kind === 'ok') b.classList.add('bg-[#e8f6ec]', 'text-[#1d7a35]')
  else if (kind === 'dry') b.classList.add('bg-[#eaf3ff]', 'text-[#0b62c4]')
  else b.classList.add('bg-[#fdecec]', 'text-[#c0392b]')
  b.innerHTML = html
}

function resetPanel() {
  $('panel').classList.remove('hidden')
  $('banner').classList.add('hidden')
  $('log').className = 'max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#1d1d1f] p-4 font-mono text-[12.5px] leading-relaxed text-[#7ee29a]'
  $('log').textContent = '正在写入文章文件…'
  renderSteps(['done', 'active', 'pending', 'pending'], '')
}

function clearForm() {
  $('content').value = ''
  $('title').value = ''
  $('slug').value = ''
  $('excerpt').value = ''
  $('tags').value = ''
  $('wordCount').textContent = ''
  coverFile = null
  $('cover').value = ''
  $('coverPreview').classList.add('hidden')
}

function startPolling(jobId, meta) {
  if (pollTimer) clearInterval(pollTimer)
  var lastLen = 0
  pollTimer = setInterval(function () {
    fetch('/api/jobs/' + jobId).then(function (r) { return r.json() }).then(function (job) {
      if (!job.ok) { stopPolling('error', '任务查询失败'); return }
      var newLines = job.lines.slice(lastLen)
      lastLen = job.lines.length
      if (newLines.length) {
        $('log').textContent += '\\n' + newLines.join('\\n')
        scrollLog()
      }
      var attempt = pushAttempt(job.lines)
      var note = ''
      if (attempt && job.status === 'running' && !job.dryRun) note = '网络抖动自动重试 · 第 ' + attempt + ' 次推送'
      renderSteps(computeStates(job.lines, job.dryRun, job.status !== 'running', job.status === 'success'), note)
      if (job.status !== 'running') {
        clearInterval(pollTimer)
        pollTimer = null
        finish(job, meta)
      }
    }).catch(function () { /* 网络抖动，下轮再试 */ })
  }, 700)
}

function stopPolling(state, msg) {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  $('log').classList.remove('text-[#7ee29a]')
  $('log').classList.add('text-[#ffb0b0]')
  $('log').textContent += '\\n' + msg
  setBusy(false)
  showBanner('bad', '❌ ' + esc(msg))
}

function finish(job, meta) {
  setBusy(false)
  if (job.status === 'success') {
    if (job.dryRun) {
      renderSteps(computeStates(job.lines, true, true, true), '')
      showBanner('dry', '📝 预演完成：已生成 <b>articles/' + esc(meta.fileName) + '</b>（未提交、未推送，确认无误后取消预演正式发布）')
    } else {
      showBanner('ok', '✅ 已推送！Vercel 构建约 1~2 分钟后上线 → <a href="' + esc(meta.liveUrl) + '" target="_blank" class="font-medium underline">' + esc(meta.liveUrl) + '</a>')
      clearForm()
      loadArticles()
    }
  } else {
    $('log').classList.remove('text-[#7ee29a]')
    $('log').classList.add('text-[#ffb0b0]')
    showBanner('bad', '❌ 发布失败，请看上方日志。常见原因：网络抖动推送 5 次均失败（可稍后重试）。')
  }
}

$('publish').addEventListener('click', function () {
  var btn = $('publish')
  if (btn.disabled) return
  setBusy(true)
  resetPanel()

  var uploadFirst = coverFile
    ? new Promise(function (ok, bad) {
        var r = new FileReader()
        r.onload = function () { ok(r.result) }
        r.onerror = bad
        r.readAsDataURL(coverFile)
      }).then(function (b64) {
        return fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: coverFile.name, dataBase64: b64, slug: $('slug').value || $('title').value }),
        }).then(function (r) { return r.json() })
      }).then(function (up) {
        if (!up.ok) throw new Error(up.output)
        return up.fileName
      })
    : Promise.resolve('')

  uploadFirst.then(function (coverFileName) {
    return fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: $('title').value,
        slug: $('slug').value,
        tags: $('tags').value || '随笔',
        excerpt: $('excerpt').value,
        cover: coverFileName,
        date: $('date').value,
        content: $('content').value,
        dryRun: $('dryRun').checked,
      }),
    }).then(function (r) { return r.json() })
  }).then(function (data) {
    if (!data.ok) {
      $('log').classList.remove('text-[#7ee29a]')
      $('log').classList.add('text-[#ffb0b0]')
      $('log').textContent = data.output || '提交失败'
      setBusy(false)
      showBanner('bad', '❌ ' + esc(data.output || '提交失败'))
      return
    }
    $('log').textContent = '已写入 articles/' + data.fileName + '\\n正在启动发布任务…'
    startPolling(data.jobId, { fileName: data.fileName, liveUrl: data.liveUrl })
  }).catch(function (err) {
    stopPolling(null, '出错：' + (err.message || err))
  })
})
</script>
</body>
</html>`
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[studio] 发布后台已启动 → http://127.0.0.1:${PORT}/`)
})
