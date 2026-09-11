/**
 * Studio CMS 服务层 —— 路由 / 权限校验 / 发布同步任务 / 定时调度
 *
 * 身份传递：请求头 x-studio-actor（作者名），服务端查 authors.json 得角色。
 * 本地工具无登录体系，权限是「编辑器层面的约定」——防止误操作，不防恶意。
 */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, watch, writeFileSync } from 'node:fs'
import { join, extname, sep } from 'node:path'
import {
  ROOT,
  STATUSES, STATUS_LABELS, ROLES, ROLE_LABELS,
  MAX_FEATURED, featuredCount,
  can, canTouchArticle, roleOf, listAuthors, saveAuthors,
  log, readLogs,
  getArticle, createArticle, updateArticle,
  changeStatus, setFlags,
  trashArticle, listTrash, restoreFromTrash, purgeTrash,
  taxonomy, renameTaxonomy, queryArticles, statusCounts, runSchedule,
  readSiteConfig, saveSiteConfig, getPagination,
} from './store.mjs'
import { page } from './page.mjs'
import { readGitConfigFile, readGitConfigLive, saveGitConfig, readGithubCredStatus, saveGithubToken, verifyGithubCred } from './gitconfig.mjs'
import { listPages, readPage, savePage, deletePage } from './store.mjs'

const coversDir = join(ROOT, 'public', 'images', 'covers')
// 预编译静态 CSS（构建期由 tailwind.config.cjs 生成），运行时零编译开销；
// 原 451KB 浏览器版构建（tailwind.js）已退役——MutationObserver 每次DOM变更全量重编译，是页面卡顿元凶之一
const studioCss = readFileSync(join(ROOT, 'scripts', 'studio-assets', 'studio.css'), 'utf8')

/* Vditor 编辑器静态资源：伺服 node_modules/vditor/dist（前端 cdn 选项指向 /vditor） */
const vditorRoot = join(ROOT, 'node_modules', 'vditor')
const MIME = {
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml',
  webp: 'image/webp', avif: 'image/avif',
  mp3: 'audio/mpeg',
}

/* ---------------- 发布同步任务（复用上一版流式机制） ---------------- */

const jobs = new Map()
const MAX_LINES = 300

function startSyncJob(message, actor) {
  const id = randomUUID().replace(/-/g, '').slice(0, 10)
  const job = { id, status: 'running', lines: [], startedAt: Date.now(), endedAt: null, actor }
  jobs.set(id, job)

  const child = spawn(process.execPath, ['scripts/publish.mjs', '--message', message], {
    cwd: ROOT,
    env: { ...process.env },
  })
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
    log(actor, code === 0 ? 'sync:success' : 'sync:fail', 'git push', `exit=${code}`)
    refreshPending() // 推送完立刻刷新角标
  })
  return id
}

/**
 * git 工作区里未推送的文章变更数（推送按钮角标）。
 *
 * 性能关键：这台机器上 git status 子进程要 ~3 秒，绝不能 execSync 阻塞事件循环
 * （之前 meta 接口被它拖到 2.5~3s，前端每次导航都调 meta → 页面每点一下卡 3 秒）。
 * 改为异步 spawn + 15 秒缓存：meta 立即返回上次结果，过期则在后台刷新。
 */
const pendingCache = { value: 0, at: 0, inflight: false }

function refreshPending() {
  if (pendingCache.inflight) return
  pendingCache.inflight = true
  const child = spawn('git', ['-c', 'core.quotepath=false', 'status', '--porcelain'], {
    cwd: ROOT,
    windowsHide: true,
  })
  let out = ''
  child.stdout.on('data', (b) => (out += b.toString('utf8')))
  child.on('error', () => {
    pendingCache.inflight = false
  })
  child.on('close', (code) => {
    if (code === 0) {
      pendingCache.value = out.split('\n').filter((l) => l.trim()).length
      pendingCache.at = Date.now()
    }
    pendingCache.inflight = false
  })
}

function pendingChanges() {
  if (Date.now() - pendingCache.at > 15_000) refreshPending() // 过期就后台刷新，不阻塞当前请求
  return pendingCache.value
}

/* ---------------- 博客数据自动同步：articles/covers 变动 → 重编译 posts.generated.ts ----------------
 * 博客 dev server 只在启动时编译一次文章数据，后台里的增删改不会反映到 5173。
 * 这里监听文章与封面目录，防抖 1.2 秒后跑 build-posts.mjs，vite HMR 让博客即时更新。
 * 状态经 /api/meta 的 blog 字段暴露给前端展示。 */
const blogBuild = { building: false, builtAt: '', pending: false, lastError: '' }
let blogWatchTimer = null

function runBuildScript(script, onDone) {
  const child = spawn(process.execPath, ['scripts/' + script], { cwd: ROOT, windowsHide: true })
  let tail = []
  const onChunk = (b) => {
    tail.push(...b.toString('utf8').split('\n').filter((l) => l.trim()))
    tail = tail.slice(-5)
  }
  child.stdout.on('data', onChunk)
  child.stderr.on('data', onChunk)
  child.on('error', (err) => onDone(1, err.message))
  child.on('close', (code) => onDone(code, tail.join(' | ')))
}

function runBlogBuild() {
  if (blogBuild.building) {
    blogBuild.pending = true
    return
  }
  blogBuild.building = true
  // 链式：文章 → 自定义页面（任一失败都进 lastError）
  runBuildScript('build-posts.mjs', (code, tail) => {
    if (code !== 0) {
      blogBuild.building = false
      blogBuild.lastError = tail.slice(-300)
      console.error('[studio] 博客数据编译失败：', blogBuild.lastError)
      if (blogBuild.pending) {
        blogBuild.pending = false
        runBlogBuild()
      }
      return
    }
    runBuildScript('build-pages.mjs', (code2, tail2) => {
      blogBuild.building = false
      if (code2 === 0) {
        blogBuild.builtAt = new Date().toISOString()
        blogBuild.lastError = ''
      } else {
        blogBuild.lastError = tail2.slice(-300)
        console.error('[studio] 自定义页面编译失败：', blogBuild.lastError)
      }
      if (blogBuild.pending) {
        blogBuild.pending = false
        runBlogBuild() // 构建期间又有新变动，补跑一次
      }
    })
  })
}

function scheduleBlogBuild() {
  clearTimeout(blogWatchTimer)
  blogWatchTimer = setTimeout(runBlogBuild, 1200)
}

function startBlogWatcher() {
  const targets = [join(ROOT, 'articles'), join(ROOT, 'public', 'images', 'covers'), join(ROOT, 'content', 'pages')]
  for (const dir of targets) {
    try {
      mkdirSync(dir, { recursive: true }) // 目录不存在先建（如首次启动还没有 content/pages），否则 watch 抛错被跳过
      watch(dir, scheduleBlogBuild)
    } catch (err) {
      console.warn(`[studio] 监听目录失败（跳过）：${dir} → ${err.message}`)
    }
  }
  // 站点配置也要监听：导航菜单里的自定义页面增删 = 页面上线/下线，必须重编页面路由
  try {
    watch(join(ROOT, 'content', 'site.json'), scheduleBlogBuild)
  } catch (err) {
    console.warn(`[studio] 监听 site.json 失败（跳过）→ ${err.message}`)
  }
  runBlogBuild() // 启动即补编译，追上停机期间的改动
}

/* ---------------- 调度器：定时上下线 ---------------- */

let syncing = false
function autoSync(actor) {
  if (syncing) return null
  syncing = true
  try {
    return startSyncJob('post: 定时任务自动上线', actor)
  } finally {
    setTimeout(() => (syncing = false), 5000)
  }
}

function tickSchedule() {
  try {
    const flipped = runSchedule()
    if (flipped.length) {
      const jobId = autoSync('scheduler')
      console.log(`[studio] 定时任务翻转 ${flipped.length} 篇，自动推送 job=${jobId}`)
    }
  } catch (err) {
    console.error('[studio] 调度器异常：', err.message)
  }
}

/* ---------------- HTTP 工具 ---------------- */

function sendJson(res, code, data) {
  if (res.headersSent) return
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

function deny(res, reason) {
  sendJson(res, 403, { ok: false, output: reason ?? '无权限执行该操作' })
}

/** 统一错误出口：业务抛错（中文消息）直接透传给前端 */
function ok(res, data) {
  sendJson(res, 200, { ok: true, ...data })
}

/* ---------------- 路由 ---------------- */

export function startStudio(port = 5199) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    const path = url.pathname
    // HTTP 头只支持 latin1，中文身份必须 URL 编码传输
    const actor = decodeURIComponent(req.headers['x-studio-actor'] || '')
    const role = roleOf(actor)

    /* ---------- 全局安全响应头（XSS 防纵深） ---------- */
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    // 给后端动作一个统一入口：校验 + 日志 + 错误兜底
    const guard = (action) => {
      if (!can(role, action)) {
        deny(res)
        return false
      }
      return true
    }

    try {
      /* ---------- 静态资源 ---------- */
      if (req.method === 'GET' && path === '/') {
        // nonce CSP：每请求随机 nonce 放行唯一内联脚本，外链脚本全走 'self'（Vditor 懒加载为同源脚本）
        const nonce = randomUUID().replaceAll('-', '')
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self' 'nonce-" + nonce + "'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        })
        res.end(page(nonce))
        return
      }
      if (req.method === 'GET' && path === '/studio.css') {
        res.writeHead(200, {
          'Content-Type': 'text/css; charset=utf-8',
          // 不缓存：CSS 是构建期产物，重新生成后必须立即可见（旧 max-age=86400 会缓存一天旧样式）
          'Cache-Control': 'no-store',
        })
        res.end(studioCss)
        return
      }
      /* Vditor 富文本编辑器（node_modules/vditor/dist 本地伺服，零 CDN 依赖） */
      if (req.method === 'GET' && path.startsWith('/vditor/')) {
        const rel = decodeURIComponent(path.slice('/vditor/'.length))
        const file = join(vditorRoot, rel)
        if (rel.includes('..') || !file.startsWith(vditorRoot + sep) || !existsSync(file) || !statSync(file).isFile()) {
          res.writeHead(404).end('not found')
          return
        }
        const ext = extname(file).slice(1)
        res.writeHead(200, {
          'Content-Type': MIME[ext] ?? 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
        })
        createReadStream(file).pipe(res)
        return
      }

      /* 封面图预览（public/images/covers 本地伺服，后台编辑器预览用） */
      if (req.method === 'GET' && path.startsWith('/covers/')) {
        const rel = decodeURIComponent(path.slice('/covers/'.length))
        const file = join(coversDir, rel)
        if (rel.includes('..') || !file.startsWith(coversDir + sep) || !existsSync(file) || !statSync(file).isFile()) {
          res.writeHead(404).end('not found')
          return
        }
        const ext = extname(file).slice(1)
        res.writeHead(200, {
          'Content-Type': MIME[ext] ?? 'application/octet-stream',
          'Cache-Control': 'no-cache',
        })
        createReadStream(file).pipe(res)
        return
      }

      /* ---------- 元信息 ---------- */
      if (req.method === 'GET' && path === '/api/meta') {
        ok(res, {
          statuses: STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          roles: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
          authors: listAuthors(),
          counts: statusCounts(),
          taxonomy: taxonomy(),
          me: { name: actor || '(未选择身份)', role },
          featured: { count: featuredCount(), max: MAX_FEATURED },
          pagination: getPagination(),
          pending: pendingChanges(),
          blog: { building: blogBuild.building, builtAt: blogBuild.builtAt, lastError: blogBuild.lastError },
        })
        return
      }

      /* ---------- 文章列表 / 详情 ---------- */
      if (req.method === 'GET' && path === '/api/articles') {
        // 每页条数只认后台「系统设置」配置的档位，未传/传了未配置档位一律用默认值
        const pagination = getPagination()
        const reqSize = Number.parseInt(url.searchParams.get('pageSize') ?? '', 10)
        const result = queryArticles({
          status: url.searchParams.get('status') ?? '',
          q: url.searchParams.get('q') ?? '',
          category: url.searchParams.get('category') ?? '',
          tag: url.searchParams.get('tag') ?? '',
          author: url.searchParams.get('author') ?? '',
          sort: url.searchParams.get('sort') ?? '',
          page: url.searchParams.get('page') ?? '',
          pageSize: Number.isInteger(reqSize) && pagination.sizes.includes(reqSize) ? reqSize : pagination.defaultSize,
        })
        ok(res, {
          articles: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        })
        return
      }

      const articleFile = path.match(/^\/api\/article\/([\w.-]+\.md)(\/(status|flags))?$/)
      if (articleFile) {
        const file = articleFile[1]
        const sub = articleFile[3]

        if (req.method === 'GET' && !sub) {
          const article = getArticle(file)
          if (!article) return sendJson(res, 404, { ok: false, output: '文章不存在' })
          return ok(res, { article })
        }

        if (req.method === 'PUT' && !sub) {
          if (!guard('article:update')) return
          const article = getArticle(file)
          if (!article) return sendJson(res, 404, { ok: false, output: '文章不存在' })
          // 作者角色：只能编辑自己的文章，且不能动 status/flags/author 字段
          const body = JSON.parse(await readBody(req))
          if (role === 'author') {
            const touch = canTouchArticle(role, 'update', article, actor)
            if (!touch.ok) return deny(res, touch.reason)
            delete body.status
            delete body.pinned
            delete body.featured
            delete body.author
          }
          const result = updateArticle(file, body)
          if (result.renamed) log(actor, 'article:rename', `${file} → ${result.file}`)
          log(actor, 'article:update', result.file)
          return ok(res, result)
        }

        if (req.method === 'POST' && sub === 'status') {
          const body = JSON.parse(await readBody(req))
          const to = body.to ?? body.action
          // author 只允许 submit（draft→review）
          if (role === 'author') {
            const article = getArticle(file)
            if (!article) return sendJson(res, 404, { ok: false, output: '文章不存在' })
            const touch = canTouchArticle(role, 'submit', article, actor)
            if (!touch.ok) return deny(res, touch.reason)
            if (to !== 'review') return deny(res, '作者角色只能提交审核，无权发布/下线')
          } else if (!guard('article:status')) {
            return
          }
          const result = changeStatus(file, to)
          log(actor, `status:${result.to}`, file, `${STATUS_LABELS[result.from]} → ${STATUS_LABELS[result.to]}`)
          return ok(res, result)
        }

        if (req.method === 'POST' && sub === 'flags') {
          if (!guard('article:flags')) return
          const body = JSON.parse(await readBody(req))
          const result = setFlags(file, body)
          log(actor, 'article:flags', file, `pinned=${result.pinned} featured=${result.featured}`)
          return ok(res, result)
        }

        if (req.method === 'DELETE' && !sub) {
          if (!guard('article:delete')) return
          const result = trashArticle(file, actor)
          log(actor, 'article:trash', file, `「${result.title}」移入回收站`)
          return ok(res, result)
        }
      }

      /* ---------- 创建 ---------- */
      if (req.method === 'POST' && path === '/api/articles') {
        if (!guard('article:create')) return
        const body = JSON.parse(await readBody(req))
        // author 角色只能创建草稿/送审，不能直接发布
        if (role === 'author' && ['published', 'offline'].includes(body.status)) {
          return deny(res, '作者角色无权直接发布，请选择草稿或提交审核')
        }
        const result = createArticle(body)
        log(actor, 'article:create', result.file, `状态：${STATUS_LABELS[body.status] ?? '草稿'}`)
        return ok(res, result)
      }

      /* ---------- 批量操作 ---------- */
      if (req.method === 'POST' && path === '/api/batch') {
        if (!guard('batch')) return
        const body = JSON.parse(await readBody(req))
        const files = Array.isArray(body.files) ? body.files : []
        if (!files.length) return sendJson(res, 400, { ok: false, output: '未选择任何文章' })

        const results = { done: [], failed: [] }
        for (const file of files) {
          try {
            if (body.action === 'delete') {
              trashArticle(file, actor)
              log(actor, 'batch:trash', file)
            } else if (STATUSES.includes(body.action)) {
              changeStatus(file, body.action)
              log(actor, 'batch:status', file, `→ ${STATUS_LABELS[body.action]}`)
            } else if (body.action === 'category') {
              const value = String(body.value ?? '').trim()
              if (!value) return sendJson(res, 400, { ok: false, output: '分类名不能为空' })
              updateArticle(file, { category: value })
              log(actor, 'batch:category', file, `→ ${value}`)
            } else if (body.action === 'tag') {
              const value = String(body.value ?? '').trim()
              if (!value) return sendJson(res, 400, { ok: false, output: '标签名不能为空' })
              const article = getArticle(file)
              const tags = [...new Set([...(article.tags ?? []), value].filter(Boolean))]
              updateArticle(file, { tags })
              log(actor, 'batch:tag', file, `+ ${body.value}`)
            } else {
              throw new Error(`未知批量动作：${body.action}`)
            }
            results.done.push(file)
          } catch (err) {
            results.failed.push({ file, reason: String(err.message || err) })
          }
        }
        return ok(res, results)
      }

      /* ---------- 回收站 ---------- */
      if (path === '/api/trash' && req.method === 'GET') {
        return ok(res, { trash: listTrash() })
      }
      if (path === '/api/trash/restore' && req.method === 'POST') {
        if (!guard('trash:restore')) return
        const body = JSON.parse(await readBody(req))
        const result = restoreFromTrash(String(body.trashName ?? ''), actor)
        log(actor, 'trash:restore', result.file)
        return ok(res, result)
      }
      const purgeMatch = path.match(/^\/api\/trash\/([\w.-]+\.md)$/)
      if (purgeMatch && req.method === 'DELETE') {
        if (role !== 'admin') return deny(res, '彻底删除仅管理员可执行')
        const result = purgeTrash(purgeMatch[1])
        log(actor, 'trash:purge', purgeMatch[1], '彻底删除，不可恢复')
        return ok(res, result)
      }

      /* ---------- 分类标签 ---------- */
      if (path === '/api/taxonomy/rename' && req.method === 'POST') {
        if (!guard('taxonomy:rename')) return
        const body = JSON.parse(await readBody(req))
        const result = renameTaxonomy(body.type, body.from, body.to)
        log(actor, 'taxonomy:rename', `${body.type}:${body.from}→${body.to}`, `${result.changed.length} 篇受影响`)
        return ok(res, result)
      }

      /* ---------- 作者与权限 ---------- */
      if (path === '/api/authors' && req.method === 'GET') {
        if (!guard('authors:read')) return
        return ok(res, { authors: listAuthors(), me: { name: actor, role } })
      }
      if (path === '/api/authors' && req.method === 'POST') {
        if (role !== 'admin') return deny(res, '作者管理仅管理员可操作')
        const body = JSON.parse(await readBody(req))
        const authors = listAuthors()
        const name = String(body.name ?? '').trim()
        if (!name) return sendJson(res, 400, { ok: false, output: '作者名不能为空' })
        if (authors.some((a) => a.name === name)) return sendJson(res, 400, { ok: false, output: '作者已存在' })
        if (!ROLES.includes(body.role)) return sendJson(res, 400, { ok: false, output: '角色不合法' })
        authors.push({ name, role: body.role })
        saveAuthors(authors)
        log(actor, 'authors:add', name, `角色：${ROLE_LABELS[body.role]}`)
        return ok(res, { authors })
      }
      const authorMatch = path.match(/^\/api\/authors\/([^/]+)$/)
      if (authorMatch && req.method === 'DELETE') {
        if (role !== 'admin') return deny(res, '作者管理仅管理员可操作')
        const name = decodeURIComponent(authorMatch[1])
        const authors = listAuthors()
        const left = authors.filter((a) => a.name !== name)
        if (left.length === authors.length) return sendJson(res, 404, { ok: false, output: '作者不存在' })
        if (!left.some((a) => a.role === 'admin')) {
          return sendJson(res, 400, { ok: false, output: '至少保留一名管理员' })
        }
        saveAuthors(left)
        log(actor, 'authors:remove', name)
        return ok(res, { authors: left })
      }

      /* ---------- 操作日志 ---------- */
      if (path === '/api/logs' && req.method === 'GET') {
        if (!guard('logs:read')) return
        return ok(res, { logs: readLogs(Number(url.searchParams.get('limit') ?? 200)) })
      }

      /* ---------- 站点设置（content/site.json） ---------- */
      /* ---------- 自定义页面（content/pages/*.md → 前台 /page/:slug） ---------- */
      if (path === '/api/pages' && req.method === 'GET') {
        return ok(res, { pages: listPages() })
      }
      if (path === '/api/pages' && req.method === 'PUT') {
        if (role !== 'admin' && role !== 'editor') return deny(res, '自定义页面仅管理员/编辑可修改')
        const body = JSON.parse(await readBody(req).catch(() => ({})))
        try {
          const result = savePage(body)
          const state = result.status === 'draft'
            ? '草稿'
            : result.reachable
              ? (result.directAccess ? '已发布 · 直链可访问' : '已发布 · 菜单可访问')
              : '已发布 · 未上线'
          log(actor, result.created ? 'page:create' : 'page:update', `content/pages/${result.slug}.md`, `「${body.title || result.slug}」${result.created ? '新建' : '更新'}（${state}）`)
          return ok(res, { ...result, pages: listPages() })
        } catch (e) {
          return sendJson(res, 400, { ok: false, output: e.message })
        }
      }
      const pageDel = path.match(/^\/api\/pages\/([a-z0-9][a-z0-9-]{0,49})$/)
      if (pageDel && req.method === 'DELETE') {
        if (role !== 'admin' && role !== 'editor') return deny(res, '自定义页面仅管理员/编辑可删除')
        try {
          const result = deletePage(pageDel[1])
          log(actor, 'page:delete', `content/pages/${result.slug}.md`, `删除自定义页面「${result.slug}」`)
          return ok(res, { ...result, pages: listPages() })
        } catch (e) {
          return sendJson(res, 400, { ok: false, output: e.message })
        }
      }
      const pageGet = path.match(/^\/api\/pages\/([a-z0-9][a-z0-9-]{0,49})$/)
      if (pageGet && req.method === 'GET') {
        const page = readPage(pageGet[1])
        if (!page) return sendJson(res, 404, { ok: false, output: '页面不存在' })
        return ok(res, { page })
      }

      if (path === '/api/site' && req.method === 'GET') {
        return ok(res, { site: readSiteConfig() })
      }
      if (path === '/api/site' && req.method === 'PUT') {
        // 站点级改动只允许 admin / editor；author 只读
        if (role !== 'admin' && role !== 'editor') {
          return sendJson(res, 403, { ok: false, output: '站点设置仅管理员/编辑可修改' })
        }
        const body = JSON.parse(await readBody(req).catch(() => ({})))
        try {
          const saved = saveSiteConfig(body)
          log(actor, 'site:update', 'content/site.json', '更新站点设置/友链')
          // 导航菜单决定自定义页面的可达性（进菜单 = 上线），改完必须重编页面路由
          scheduleBlogBuild()
          return ok(res, { site: saved })
        } catch (e) {
          return sendJson(res, 400, { ok: false, output: e.message })
        }
      }

      /* ---------- 本地 git 配置（后台界面直改，存 git.config.local 不上传） ---------- */
      if (path === '/api/git-config' && req.method === 'GET') {
        return ok(res, { file: readGitConfigFile(), live: readGitConfigLive(), cred: readGithubCredStatus() })
      }
      if (path === '/api/git-config' && req.method === 'POST') {
        if (role !== 'admin') return deny(res, 'Git 配置仅管理员可修改')
        const body = JSON.parse(await readBody(req).catch(() => ({})))
        try {
          const { applied } = saveGitConfig(body.entries)
          // PAT 可选：填了才写凭证库；日志永不包含 token
          if (body.githubToken) saveGithubToken(body.githubToken, body.githubUsername)
          log(actor, 'git-config:update', 'git.config.local', '更新本地 git 配置: ' + applied.join(', ') + (body.githubToken ? '；保存 GitHub 推送凭证' : ''))
          return ok(res, { file: readGitConfigFile(), live: readGitConfigLive(), applied, cred: readGithubCredStatus() })
        } catch (e) {
          return sendJson(res, 400, { ok: false, output: e.message })
        }
      }

      if (path === '/api/git-config/verify' && req.method === 'POST') {
        if (role !== 'admin') return deny(res, 'Git 配置仅管理员可操作')
        const r = verifyGithubCred()
        log(actor, 'git-config:verify', 'origin', '验证推送凭证: ' + (r.ok ? '可用' : r.message))
        return ok(res, r)
      }

      /* ---------- 推送上线（git commit + push，流式任务） ---------- */
      if (path === '/api/sync' && req.method === 'POST') {
        if (!guard('sync')) return
        const body = JSON.parse(await readBody(req).catch(() => ({})))
        if (body.dryRun) {
          // 预演：起 job 跑 --dry-run，前端同样走轮询
          const id = randomUUID().replace(/-/g, '').slice(0, 10)
          const job = { id, status: 'running', lines: [], startedAt: Date.now(), endedAt: null, actor }
          jobs.set(id, job)
          const child = spawn(process.execPath, ['scripts/publish.mjs', '--dry-run'], { cwd: ROOT })
          child.stdout.on('data', (b) => job.lines.push(...b.toString('utf8').split('\n').filter((l) => l.trim())))
          child.stderr.on('data', (b) => job.lines.push(...b.toString('utf8').split('\n').filter((l) => l.trim())))
          child.on('close', (code) => {
            job.status = code === 0 ? 'success' : 'error'
            job.endedAt = Date.now()
          })
          return ok(res, { jobId: id, dryRun: true })
        }
        const jobId = startSyncJob(String(body.message ?? 'update: 博客内容更新'), actor)
        log(actor, 'sync:start', 'git push')
        return ok(res, { jobId })
      }
      if (path.startsWith('/api/jobs/') && req.method === 'GET') {
        const job = jobs.get(path.slice('/api/jobs/'.length))
        if (!job) return sendJson(res, 404, { ok: false, output: '任务不存在' })
        return ok(res, { ...job })
      }

      /* ---------- 封面图上传（沿用） ---------- */
      if (path === '/api/upload' && req.method === 'POST') {
        const body = JSON.parse(await readBody(req))
        const ext = extname(body.name || '').toLowerCase()
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) {
          return sendJson(res, 400, { ok: false, output: `不支持的图片格式：${ext}` })
        }
        const base64 = String(body.dataBase64 || '').replace(/^data:[^;]+;base64,/, '')
        if (!base64) return sendJson(res, 400, { ok: false, output: '图片数据为空' })
        mkdirSync(coversDir, { recursive: true })
        const fileName = `${(body.slug || `cover-${Date.now()}`).toString().toLowerCase().replace(/[^a-z0-9-]/g, '')}${ext === '.jpeg' ? '.jpg' : ext}`
        writeFileSync(join(coversDir, fileName), Buffer.from(base64, 'base64'))
        return ok(res, { fileName })
      }

      sendJson(res, 404, { ok: false, output: 'not found' })
    } catch (err) {
      // 响应已发出后再出错只能记日志，绝不能再写响应（会把进程炸掉）
      console.error(`[studio] ${req.method} ${path} 处理异常：`, err.stack || err.message || err)
      if (!res.headersSent) sendJson(res, 400, { ok: false, output: String(err.message || err) })
      else res.end()
    }
  })

  // 启动即补跑一次错过的定时任务，之后每 30 秒扫描
  setTimeout(tickSchedule, 3000)
  setInterval(tickSchedule, 30_000)
  // 启动博客数据监听：后台改动自动重编译 → 博客 5173 实时更新
  startBlogWatcher()

  server.listen(port, '127.0.0.1', () => {
    console.log(`[studio] CMS 已启动 → http://127.0.0.1:${port}/`)
  })
  return server
}
