/**
 * 发布一条龙：文件名规范化 → git 提交 → 推送触发 CI 部署
 *
 * 用法：npm run pub [-- --dry-run]
 *
 * 流程：
 *   1. 扫描 articles/*.md，文件名不符合 <publishedAt>-<slug>.md 规范的
 *      用 git mv 改名（保留历史，fallback 普通 rename）；
 *   2. 按白名单暂存内容与源码（绝不用 `git add -A`），按本次新增/修改的
 *      文章标题生成 commit message；
 *   3. git push，网络抖动自动重试（本机代理间歇 502/reset，重试即可）。
 *
 * --dry-run：只执行第 1 步并打印将要执行的 git 命令，不动仓库。
 *
 * 安全约束（勿回退）：
 *   - 所有 git 调用必须走参数数组（execFileSync），**不得**拼 shell 字符串；
 *   - 暂存必须走白名单，提交前还要扫一遍暂存区，命中密钥特征即中止。
 */
import { existsSync, readFileSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from './lib/markdown.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const DRY_RUN = process.argv.includes('--dry-run')

const isArticle = (name) => name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_')

/**
 * 唯一 git 出口：参数数组 + execFileSync，不经过 shell。
 *
 * 原实现 `execSync(\`git -c core.quotepath=false ${args}\`)` 把整条命令拼成字符串，
 * commit message 只做了 `"` → `\"` 的转义 —— 而 cmd.exe 里反斜杠没有转义语义，
 * 正文里的 `"` 会提前闭合参数，其后的 `&` 直接被当成命令分隔符执行。
 * 实测 `ab" & echo INJECTED_OK & ver "` 可跑出任意命令，故此处彻底改为参数数组：
 * 参数不再被任何 shell 解析，注入面归零。
 */
function git(args, options = {}) {
  // core.quotepath=false：中文路径不被转义成八进制，否则文件匹配全部失效
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: options.quiet ? 'pipe' : 'inherit',
  })
}

/**
 * 允许发布的路径白名单（目录用前缀匹配）。
 *
 * 仓库是 public：一条 `git add -A` 就能把本地 `.env` / 密钥推进公开历史，
 * 而 git 历史里的东西删不干净。所以改为「只暂存明确该进仓库的东西」，
 * 新增顶层目录时记得补进这张表（脚本会提示被跳过的改动）。
 */
const TRACKED_PATHS = [
  // 内容与源码
  'articles', 'content', 'public', 'src', 'scripts', 'tests',
  'index.html', 'package.json', 'package-lock.json',
  // 构建与规范配置
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'vite.config.ts', 'vite.config.smoke.ts', 'vercel.json',
  'tailwind.config.cjs', 'eslint.config.js',
  // 文档与约定文件
  '.gitignore', '.gitattributes', 'git.config.local.example', 'README.md', 'DEPLOY.md',
]

/** 密钥 / 本地环境文件特征：暂存区里出现任何一条就中止提交 */
const SENSITIVE_RE =
  /(?:^|\/)(?:\.env(?:\.[\w.-]+)?|\.npmrc|\.netrc|id_rsa|id_ed25519|git\.config\.local)$|\.(?:key|pem|p12|pfx|jks|keystore|sqlite3?|bak|orig|rej)$/i

const isWhitelisted = (p) => TRACKED_PATHS.some((t) => p === t || p.startsWith(t + '/'))

/* ---------- 1. 文件名规范化：<publishedAt>-<slug>.md ---------- */

const renamed = []
for (const name of git(['ls-files', 'articles/'], { quiet: true }).split('\n')) {
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
      git(['mv', name, target], { quiet: true })
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
    return git(['status', '--porcelain'], { quiet: true }).trim().length > 0
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
  const changed = git(['status', '--porcelain'], { quiet: true })
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
  console.log(`[pub] [dry-run] 将执行: git add <白名单 ${TRACKED_PATHS.length} 项>`)
  console.log(`[pub] [dry-run] 将执行: git commit -m "${message}"`)
  console.log(`[pub] [dry-run] 将执行: git push origin main`)
  process.exit(0)
}

// 只暂存白名单内确实存在的路径
const addTargets = TRACKED_PATHS.filter((p) => existsSync(join(root, p)))
git(['add', '--', ...addTargets])

// 兜底：万一白名单漏了、或有东西被强制加入，提交前再扫一次暂存区
const staged = git(['diff', '--cached', '--name-only'], { quiet: true })
  .split('\n')
  .map((p) => p.trim())
  .filter(Boolean)
const leaked = staged.filter((p) => SENSITIVE_RE.test(p))
if (leaked.length) {
  console.error('[pub] 已中止：暂存区里出现疑似密钥 / 本地环境文件，绝不允许推送到公开仓库：')
  for (const p of leaked) console.error(`       ${p}`)
  console.error('[pub] 处理办法：把它们写进 .gitignore，再执行 git reset 取消暂存后重试。')
  process.exit(1)
}

// 提示被白名单跳过的改动，避免「改了却没发布」的静默失败
const skippedPaths = git(['status', '--porcelain'], { quiet: true })
  .split('\n')
  .map((line) => line.slice(3).trim().replaceAll('"', ''))
  .filter(Boolean)
  .filter((p) => !isWhitelisted(p))
if (skippedPaths.length) {
  console.warn('[pub] 提示：以下改动不在发布白名单内，未提交（如属正常内容请补进 TRACKED_PATHS）：')
  for (const p of skippedPaths) console.warn(`       ${p}`)
}

git(['commit', '-m', message])

/* ---------- 3. 推送（网络抖动重试） ---------- */

let pushed = false
for (let i = 1; i <= 5; i++) {
  console.log(`[pub] 推送中（第 ${i} 次）…`)
  try {
    git(['push', 'origin', 'main'])
    pushed = true
    break
  } catch {
    console.warn('[pub] 推送失败，3 秒后重试…')
    // 原实现 execSync('sleep 3')：Windows 走 cmd.exe 没有 sleep 命令，
    // 抛出的异常还不在 try/catch 内 → 首次推送失败就把整个脚本打断，重试形同虚设。
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
}

if (pushed) {
  console.log('[pub] 已推送，Vercel 构建约 1~2 分钟后上线：')
  console.log('[pub] https://wanfengyin-blog.vercel.app')
} else {
  console.error('[pub] 连续 5 次推送失败，请检查网络后手动 git push。')
  process.exit(1)
}
