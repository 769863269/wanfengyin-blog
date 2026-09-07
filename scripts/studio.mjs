/**
 * 本地发布后台（晚风吟 Studio）
 *
 * 用法：npm run studio → 浏览器打开 http://127.0.0.1:5199/
 *
 * 在页面上填标题/标签/正文、传封面图，点「发布」即自动完成：
 * 写入 articles/*.md（规范命名）→ 保存图片到 public/images/covers/ →
 * 复用 scripts/publish.mjs 提交推送 → CI 部署上线。
 *
 * 仅监听 127.0.0.1，无外部依赖（Node 内置 http）。
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
        liveUrl: result.ok && !body.dryRun ? `https://769863269.github.io/wanfengyin-blog/post/${slug}/` : null,
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

/* ---------------- 页面 ---------------- */

function page() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>晚风吟 · 发布后台</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "SF Pro Text", "Segoe UI", "Microsoft YaHei", sans-serif;
    background: #f5f5f7; color: #1d1d1f; min-height: 100vh; padding: 40px 20px;
  }
  .wrap { max-width: 860px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 600; margin-bottom: 6px; }
  .sub { color: #6e6e73; font-size: 14px; margin-bottom: 28px; }
  .sub a { color: #0071e3; text-decoration: none; }
  .card {
    background: #fff; border-radius: 18px; padding: 28px 32px; margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,.06);
  }
  label { display: block; font-size: 13px; font-weight: 600; color: #6e6e73; margin: 18px 0 6px; }
  label:first-child { margin-top: 0; }
  input[type=text], input[type=date], textarea {
    width: 100%; border: 1px solid #d2d2d7; border-radius: 10px; padding: 10px 14px;
    font-size: 15px; font-family: inherit; outline: none; transition: border-color .2s;
  }
  textarea { resize: vertical; }
  textarea:focus, input:focus { border-color: #0071e3; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .body-area { font-family: ui-monospace, Consolas, monospace; font-size: 13.5px; min-height: 320px; line-height: 1.6; }
  .cover-row { display: flex; align-items: center; gap: 14px; }
  .cover-preview { width: 160px; height: 90px; border-radius: 10px; background: #f5f5f7 center/cover no-repeat; display: none; }
  .btn {
    border: none; border-radius: 980px; padding: 12px 32px; font-size: 15px; font-weight: 600;
    cursor: pointer; background: #0071e3; color: #fff; transition: opacity .2s;
  }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-ghost { background: #e8e8ed; color: #1d1d1f; }
  .actions { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
  .check { font-size: 13px; color: #6e6e73; display: flex; align-items: center; gap: 6px; }
  #log {
    display: none; margin-top: 20px; background: #1d1d1f; color: #a8f0b8; border-radius: 12px;
    padding: 16px; font-family: ui-monospace, Consolas, monospace; font-size: 12.5px;
    white-space: pre-wrap; line-height: 1.7; max-height: 260px; overflow: auto;
  }
  #log.err { color: #ffb0b0; }
  #live { display: none; margin-top: 14px; font-size: 14px; }
  #live a { color: #0071e3; }
  details { margin-top: 8px; }
  summary { cursor: pointer; font-size: 13px; color: #6e6e73; }
  .art-list { list-style: none; }
  .art-list li {
    display: flex; justify-content: space-between; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid #f0f0f2; font-size: 14px;
  }
  .art-list .date { color: #86868b; min-width: 90px; }
  .art-list .slug { color: #86868b; font-size: 12px; }
  .hint { font-size: 12px; color: #86868b; margin-top: 4px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>晚风吟 · 发布后台</h1>
  <p class="sub">填写 → 点发布 → 自动上线。本地预览：<a href="http://127.0.0.1:5173/" target="_blank">127.0.0.1:5173</a></p>

  <div class="card">
    <label>标题 *</label>
    <input type="text" id="title" placeholder="文章标题" />

    <div class="row">
      <div>
        <label>slug（网址名，留空自动生成）</label>
        <input type="text" id="slug" placeholder="my-first-post" />
        <p class="hint">只允许小写字母、数字、中划线</p>
      </div>
      <div>
        <label>标签（逗号分隔）</label>
        <input type="text" id="tags" placeholder="前端, Vue" />
      </div>
    </div>

    <label>摘要（显示在列表和搜索里）</label>
    <textarea id="excerpt" rows="2" placeholder="一两句话说清这篇文章讲了什么"></textarea>

    <label>封面图（可选）</label>
    <div class="cover-row">
      <input type="file" id="cover" accept="image/*" />
      <div class="cover-preview" id="coverPreview"></div>
    </div>

    <div class="row">
      <div>
        <label>发布日期</label>
        <input type="date" id="date" />
      </div>
    </div>

    <label>正文（Markdown，## 是小节标题，\`\`\`ts 是代码块）*</label>
    <textarea id="content" class="body-area" placeholder="## 第一个小节

正文直接写 Markdown。"></textarea>

    <div class="actions">
      <button class="btn" id="publish">发布</button>
      <label class="check"><input type="checkbox" id="dryRun" /> 预演（只生成文件，不推送）</label>
    </div>

    <pre id="log"></pre>
    <p id="live"></p>
  </div>

  <div class="card">
    <details open>
      <summary>已发布文章（<span id="artCount">…</span>）</summary>
      <ul class="art-list" id="artList"></ul>
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
  if (!coverFile) { p.style.display = 'none'; return }
  const reader = new FileReader()
  reader.onload = () => {
    p.style.backgroundImage = 'url(' + reader.result + ')'
    p.style.display = 'block'
  }
  reader.readAsDataURL(coverFile)
})

async function loadArticles() {
  const { articles } = await (await fetch('/api/articles')).json()
  $('artCount').textContent = articles.length + ' 篇'
  $('artList').innerHTML = articles
    .map((a) => '<li><span class="date">' + a.date + '</span><span style="flex:1">' + a.title +
      '</span><span class="slug">' + a.slug + '</span></li>')
    .join('')
}
loadArticles()

$('publish').addEventListener('click', async () => {
  const btn = $('publish')
  const log = $('log')
  btn.disabled = true
  btn.textContent = '发布中…'
  log.className = ''
  log.style.display = 'block'
  log.textContent = '正在写入文章并推送，推送遇网络抖动会自动重试，请稍候…'
  $('live').style.display = 'none'
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
    log.className = data.ok ? '' : 'err'
    log.textContent = data.output || (data.ok ? '完成' : '失败')
    if (data.ok && data.liveUrl) {
      $('live').style.display = 'block'
      $('live').innerHTML = '✅ 已上线：<a href="' + data.liveUrl + '" target="_blank">' + data.liveUrl + '</a>（CI 构建 ~1 分钟后可访问）'
      $('content').value = ''
      $('title').value = ''
      $('excerpt').value = ''
      coverFile = null
      $('cover').value = ''
      $('coverPreview').style.display = 'none'
      loadArticles()
    } else if (data.ok && data.fileName) {
      $('live').style.display = 'block'
      $('live').innerHTML = '📝 预演完成，已生成 articles/' + data.fileName + '（未推送）'
    }
  } catch (err) {
    log.className = 'err'
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
