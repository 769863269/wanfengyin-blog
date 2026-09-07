/**
 * 本地发布后台（晚风吟 Studio）
 *
 * 用法：npm run studio → 浏览器打开 http://127.0.0.1:5199/
 *
 * 在页面上填标题/标签/正文、传封面图，点「发布」即自动完成：
 * 写入 articles/*.md（规范命名）→ 保存图片到 public/images/covers/ →
 * 复用 scripts/publish.mjs 提交推送 → CI 部署上线。
 *
 * 样式：Tailwind CSS（scripts/studio-assets/tailwind.js 本地伺服，离线可用）。
 * 仅监听 127.0.0.1，运行时零外部依赖（Node 内置 http）。
 */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
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
        }
      } catch {
        return { file: f, title: f, slug: '', date: '', tags: [] }
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

function runPublish(message, dryRun) {
  const args = ['scripts/publish.mjs', '--message', message]
  if (dryRun) args.push('--dry-run')
  try {
    const output = execSync(`node ${args.map((a) => `"${a}"`).join(' ')}`, {
      cwd: root,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env },
    })
    return { ok: true, output: output.trim().split('\n').slice(-15).join('\n') }
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join('\n').trim()
    return { ok: false, output: output.split('\n').slice(-15).join('\n') || String(err.message) }
  }
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
      const result = runPublish(`post: ${title}`, Boolean(body.dryRun))
      sendJson(res, result.ok ? 200 : 500, {
        ...result,
        fileName,
        liveUrl: result.ok && !body.dryRun ? `https://wanfengyin-blog.vercel.app/post/${slug}/` : null,
      })
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

/* ---------------- 页面（Tailwind CSS） ---------------- */

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
  }
</style>
</head>
<body class="min-h-screen bg-[#f5f5f7] px-5 py-10 text-[#1d1d1f] antialiased">
<div class="mx-auto max-w-[860px]">
  <h1 class="text-[28px] font-semibold tracking-tight">晚风吟 · 发布后台</h1>
  <p class="mt-1.5 mb-7 text-sm text-[#6e6e73]">
    填写 → 点发布 → 自动上线。本地预览：<a href="http://127.0.0.1:5173/" target="_blank" class="text-[#0071e3] hover:underline">127.0.0.1:5173</a>
  </p>

  <div class="mb-5 rounded-[18px] bg-white px-8 py-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
    <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">标题 *</label>
    <input type="text" id="title" placeholder="文章标题"
      class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-[#0071e3]" />

    <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">slug（网址名，留空自动生成）</label>
        <input type="text" id="slug" placeholder="my-first-post"
          class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-[#0071e3]" />
        <p class="mt-1 text-xs text-[#86868b]">只允许小写字母、数字、中划线</p>
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[#6e6e73]">标签（逗号分隔）</label>
        <input type="text" id="tags" placeholder="前端, Vue"
          class="w-full rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-[#0071e3]" />
      </div>
    </div>

    <label class="mb-1.5 mt-5 block text-[13px] font-semibold text-[#6e6e73]">摘要（显示在列表和搜索里）</label>
    <textarea id="excerpt" rows="2" placeholder="一两句话说清这篇文章讲了什么"
      class="w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-[#0071e3]"></textarea>

    <label class="mb-1.5 mt-5 block text-[13px] font-semibold text-[#6e6e73]">封面图（可选）</label>
    <div class="flex items-center gap-3.5">
      <input type="file" id="cover" accept="image/*" class="text-sm" />
      <div id="coverPreview" class="hidden h-[90px] w-40 rounded-[10px] bg-[#f5f5f7] bg-center bg-no-repeat [background-size:cover]"></div>
    </div>

    <label class="mb-1.5 mt-5 block text-[13px] font-semibold text-[#6e6e73]">发布日期</label>
    <input type="date" id="date"
      class="rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-[#0071e3]" />

    <label class="mb-1.5 mt-5 block text-[13px] font-semibold text-[#6e6e73]">正文（Markdown，## 是小节标题，\`\`\`ts 是代码块）*</label>
    <textarea id="content" placeholder="## 第一个小节

正文直接写 Markdown。"
      class="min-h-[320px] w-full resize-y rounded-[10px] border border-[#d2d2d7] px-3.5 py-2.5 font-mono text-[13.5px] leading-relaxed outline-none transition-colors focus:border-[#0071e3]"></textarea>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <button id="publish"
        class="rounded-full bg-[#0071e3] px-8 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">发布</button>
      <label class="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6e6e73]">
        <input type="checkbox" id="dryRun" class="accent-[#0071e3]" /> 预演（只生成文件，不推送）
      </label>
    </div>

    <pre id="log" class="mt-5 hidden max-h-[260px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#1d1d1f] p-4 font-mono text-[12.5px] leading-relaxed text-[#a8f0b8]"></pre>
    <p id="live" class="mt-3.5 hidden text-sm"></p>
  </div>

  <div class="rounded-[18px] bg-white px-8 py-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
    <details open>
      <summary class="cursor-pointer text-[13px] text-[#6e6e73]">已发布文章（<span id="artCount">…</span>）</summary>
      <ul id="artList" class="mt-2 list-none"></ul>
    </details>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id)
$('date').value = new Date().toISOString().slice(0, 10)

// 标题输入 → 自动建议 slug（取英数字，中文标题自动生成 post-日期）
$('title').addEventListener('input', () => {
  const s = $('title').value.toLowerCase().match(/[a-z0-9]+/g)
  $('slug').placeholder = s ? s.join('-') : 'post-' + new Date().toISOString().slice(0, 10).replaceAll('-', '')
})

// 封面图本地预览
let coverFile = null
$('cover').addEventListener('change', () => {
  coverFile = $('cover').files[0] || null
  const p = $('coverPreview')
  if (!coverFile) { p.classList.add('hidden'); return }
  const reader = new FileReader()
  reader.onload = () => {
    p.style.backgroundImage = 'url(' + reader.result + ')'
    p.classList.remove('hidden')
  }
  reader.readAsDataURL(coverFile)
})

function artRow(a) {
  return '<li class="flex items-center gap-3 border-b border-[#f0f0f2] py-2.5 text-sm last:border-0">' +
    '<span class="min-w-[90px] text-[#86868b]">' + a.date + '</span>' +
    '<span class="flex-1">' + a.title + '</span>' +
    '<span class="text-xs text-[#86868b]">' + a.slug + '</span></li>'
}

async function loadArticles() {
  const { articles } = await (await fetch('/api/articles')).json()
  $('artCount').textContent = articles.length + ' 篇'
  $('artList').innerHTML = articles.map(artRow).join('')
}
loadArticles()

$('publish').addEventListener('click', async () => {
  const btn = $('publish')
  const log = $('log')
  btn.disabled = true
  btn.textContent = '发布中…'
  log.classList.remove('hidden', 'text-[#ffb0b8]')
  log.classList.add('text-[#a8f0b8]')
  log.textContent = '正在写入文章并推送，推送遇网络抖动会自动重试，请稍候…'
  $('live').classList.add('hidden')
  try {
    let coverFileName = ''
    if (coverFile) {
      const b64 = await new Promise((ok, bad) => {
        const r = new FileReader()
        r.onload = () => ok(r.result)
        r.onerror = bad
        r.readAsDataURL(coverFile)
      })
      const up = await (await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: coverFile.name, dataBase64: b64, slug: $('slug').value || $('title').value }),
      })).json()
      if (!up.ok) throw new Error(up.output)
      coverFileName = up.fileName
    }
    const resp = await fetch('/api/publish', {
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
    })
    const data = await resp.json()
    if (!data.ok) log.classList.replace('text-[#a8f0b8]', 'text-[#ffb0b0]')
    log.textContent = data.output || (data.ok ? '完成' : '失败')
    if (data.ok && data.liveUrl) {
      $('live').classList.remove('hidden')
      $('live').innerHTML = '✅ 已上线：<a href="' + data.liveUrl + '" target="_blank" class="text-[#0071e3] hover:underline">' + data.liveUrl + '</a>（CI 构建 ~1 分钟后可访问）'
      $('content').value = ''
      $('title').value = ''
      $('excerpt').value = ''
      coverFile = null
      $('cover').value = ''
      $('coverPreview').classList.add('hidden')
      loadArticles()
    } else if (data.ok && data.fileName) {
      $('live').classList.remove('hidden')
      $('live').innerHTML = '📝 预演完成，已生成 articles/' + data.fileName + '（未推送）'
    }
  } catch (err) {
    log.classList.replace('text-[#a8f0b8]', 'text-[#ffb0b0]')
    log.textContent = '出错：' + (err.message || err)
  } finally {
    btn.disabled = false
    btn.textContent = '发布'
  }
})
</script>
</body>
</html>`
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[studio] 发布后台已启动 → http://127.0.0.1:${PORT}/`)
})
