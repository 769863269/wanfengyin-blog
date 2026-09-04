/**
 * 发布一条龙：文件名规范化 → git 提交 → 推送触发 CI 部署
 *
 * 用法：npm run pub [-- --dry-run]
 *
 * 流程：
 *   1. 扫描 articles/*.md，文件名不符合 <publishedAt>-<slug>.md 规范的
 *      用 git mv 改名（保留历史，fallback 普通 rename）；
 *   2. git add -A，按本次新增/修改的文章标题生成 commit message；
 *   3. git push，网络抖动自动重试（本机代理间歇 502/reset，重试即可）。
 *
 * --dry-run：只执行第 1 步并打印将要执行的 git 命令，不动仓库。
 */
import { existsSync, readFileSync, renameSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from './lib/markdown.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const articlesDir = join(root, 'articles')
const DRY_RUN = process.argv.includes('--dry-run')

const isArticle = (name) => name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_')

function git(args, options = {}) {
  // core.quotepath=false：中文路径不被转义成八进制，否则文件匹配全部失效
  return execSync(`git -c core.quotepath=false ${args}`, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.quiet ? 'pipe' : 'inherit',
  })
}

/* ---------- 1. 文件名规范化：<publishedAt>-<slug>.md ---------- */

const renamed = []
for (const name of git('ls-files articles/', { quiet: true }).split('\n')) {
  const file = basename(name)
  if (!name || !isArticle(file)) continue

  // 文件缺失（外部误删/回收区劫持）只警告不崩溃，避免脚本半途死掉
  if (!existsSync(join(root, name))) {
    console.warn(`[pub] 警告：文件丢失，跳过改名检查: ${file}`)
    continue
  }

  const { data } = parseFrontmatter(readFileSync(join(root, name), 'utf8'))
  const expected = data.publishedAt && data.slug ? `${data.publishedAt}-${data.slug}.md` : null

  if (!expected) {
    console.warn(`[pub] 跳过（frontmatter 缺 slug/publishedAt）: ${file}`)
    continue
  }
  if (file === expected) continue

  // 目标名已被占用时追加序号，避免覆盖
  let target = `articles/${expected}`
  let seq = 2
  while (existsSync(join(root, target))) {
    target = `articles/${expected.replace(/\.md$/, `-${seq++}.md`)}`
  }

  if (DRY_RUN) {
    console.log(`[pub] 将改名: ${file} → ${basename(target)}`)
  } else {
    try {
      git(`mv "${name}" "${target}"`, { quiet: true })
    } catch {
      renameSync(join(root, name), join(root, target))
    }
    console.log(`[pub] 已改名: ${file} → ${basename(target)}`)
  }
  renamed.push(target)
}

/* ---------- 2. 提交 ---------- */

const dirty = (() => {
  try {
    return git('status --porcelain', { quiet: true }).trim().length > 0
  } catch {
    return false
  }
})()

if (!dirty && !DRY_RUN) {
  console.log('[pub] 没有需要发布的变更。')
  process.exit(0)
}

// 从变更里挑出文章文件，取标题拼 commit message；--message 可覆盖
const msgIdx = process.argv.indexOf('--message')
const customMessage = msgIdx !== -1 ? process.argv[msgIdx + 1] : undefined

let message = customMessage || 'update: 博客内容更新'
if (!DRY_RUN) {
  const changed = git('status --porcelain', { quiet: true })
    .split('\n')
    .map((line) => line.slice(3).trim().replaceAll('"', ''))
    .filter((path) => path.startsWith('articles/') && isArticle(basename(path)))

  const titles = [...new Set(changed)].map((path) => {
    const { data } = parseFrontmatter(readFileSync(join(root, path), 'utf8'))
    return data.title || basename(path, '.md')
  })
  if (titles.length) message = `post: ${titles.join(' / ')}`
} else if (renamed.length) {
  message = `post: ${renamed.map((p) => basename(p, '.md')).join(' / ')}`
}

if (DRY_RUN) {
  console.log(`[pub] [dry-run] 将执行: git add -A`)
  console.log(`[pub] [dry-run] 将执行: git commit -m "${message}"`)
  console.log(`[pub] [dry-run] 将执行: git push origin main`)
  process.exit(0)
}

git('add -A')
git(`commit -m "${message.replaceAll('"', '\\"')}"`)
/* ---------- 3. 推送（网络抖动重试） ---------- */

let pushed = false
for (let i = 1; i <= 5; i++) {
  console.log(`[pub] 推送中（第 ${i} 次）…`)
  try {
    git('push origin main')
    pushed = true
    break
  } catch {
    console.warn('[pub] 推送失败，3 秒后重试…')
    execSync('sleep 3')
  }
}

if (pushed) {
  console.log('[pub] 已推送，CI 构建约 1 分钟后上线：')
  console.log('[pub] https://769863269.github.io/wanfengyin-blog/')
} else {
  console.error('[pub] 连续 5 次推送失败，请检查网络后手动 git push。')
  process.exit(1)
}
