/**
 * 本地 git 配置的读写与应用（Studio「系统设置 → Git 推送配置」的服务层）
 *
 * 数据流：后台表单 → git.config.local（gitignore 排除，永不上传 GitHub）
 *        → 同步写入本仓库 local config（git config <key> <value>），保存即生效
 *
 * 安全边界：
 * - key 白名单：只允许操作下面这几项，防止把任意 git 配置（如 core.hooksPath）当跳板
 * - value 校验：单行、无控制字符、不以 - 开头（防被当 flag）；execFile 参数数组传递，无 shell 注入面
 *
 * ⚠️ 本文件绝不使用 execFileSync。
 * 这台机器上每次 spawn 一个 git 进程约 2 秒（PortableGit 启动开销），而 execFileSync
 * 会把整个 Node 事件循环按住 —— studio 是单线程 HTTP 服务，期间所有请求（切菜单、
 * 拉列表）全部排队。实测：/api/articles 平时 7ms，被同步 git 调用挡住时变成 12000ms。
 * 所以一律走异步 execFile + 超时 + 缓存（与 server.mjs 的 pendingChanges 同一套路）。
 */
import { existsSync, readFileSync, writeFileSync, chmodSync, statSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { join, isAbsolute } from 'node:path'
import { ROOT } from './store.mjs'

const execFileAsync = promisify(execFile)

/** 异步执行 git；默认 8 秒超时，避免 git 等锁时无限挂起（曾经把设置页挂死过） */
function git(args, opts) {
  return execFileAsync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 8000,
    ...opts,
  })
}

const CONFIG_FILE = join(ROOT, 'git.config.local')
const CRED_FILE = join(homedir(), '.git-credentials')

/** 允许在后台设置的 git 配置项白名单 */
export const GIT_KEYS = ['http.version', 'user.name', 'user.email', 'core.autocrlf', 'pull.rebase', 'push.default', 'credential.helper']

const FILE_HEADER = [
  '# 本项目本地 git 配置（不入库，不上传 GitHub）',
  '# 由 Studio「系统设置 → Git 推送配置」维护，也可手工编辑',
  '# 每行一条：key=value；# 开头为注释',
]

function keyAllowed(k) {
  return GIT_KEYS.includes(k)
}

function valueOk(v) {
  return (
    typeof v === 'string' &&
    v.length > 0 &&
    v.length <= 200 &&
    !/[\r\n]/.test(v) &&
    v.indexOf('\u0000') === -1 &&
    !v.startsWith('-')
  )
}

/** 读 git.config.local 文件内容（键值对象）；文件不存在返回 {} */
export function readGitConfigFile() {
  if (!existsSync(CONFIG_FILE)) return {}
  const out = {}
  for (const line of readFileSync(CONFIG_FILE, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq <= 0) continue
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return out
}

/**
 * 读当前仓库 local config 的实际生效值（白名单 key）。
 *
 * 性能设计（这是「后台切换很卡」的修复核心）：
 * 1. **直读 .git/config**（主路径，约 1ms）：`git config --local` 读的就是这个文件，
 *    自己解析 INI 与 git 等价，却完全不需要起进程 —— 本机 spawn 一次 git 要 2~5 秒。
 * 2. **异步子进程兜底**：.git 是文件（worktree）/ 无权限等读不到时，退回
 *    `git config --local --list`（一条命令拿全量，替代原先逐 key 探测的 7 次：7×2s → 1×2s），
 *    并且始终异步 —— 绝不再把事件循环按住（原来整个后台会被同步 git 卡死 12 秒）。
 * 3. **兜底路径带缓存 + 后台刷新**：有旧值就先用旧值，刷新在后台跑。
 * @returns {Promise<{[k: string]: string}>}
 */
const LIVE_TTL = 30_000
const liveCache = { value: null, at: 0, inflight: null }

/** 定位 GIT_DIR：正常是 .git 目录；worktree/submodule 时 .git 是含 "gitdir: ..." 的文本文件 */
function gitDir() {
  const dotGit = join(ROOT, '.git')
  try {
    if (statSync(dotGit).isDirectory()) return dotGit
    const m = readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m)
    if (!m) return ''
    const p = m[1].trim()
    return isAbsolute(p) ? p : join(ROOT, p)
  } catch {
    return ''
  }
}

/**
 * 解析 git config 的 INI 文本 → { 'section.key': value }（key 全小写，git 的 section/key 名大小写不敏感）
 * 只覆盖 `[section]` 形式；`[section "sub"]` 归入 section 本身（白名单里没有 subsection 项）。
 * 导出仅为单测使用。
 */
export function parseIniConfig(text) {
  const out = {}
  let section = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith(';')) continue
    if (line.startsWith('[')) {
      const end = line.indexOf(']')
      const inner = end > 0 ? line.slice(1, end) : line.slice(1)
      const name = inner.split(/[\s"]/)[0]
      section = name ? name.toLowerCase() + '.' : ''
      continue
    }
    const eq = line.indexOf('=')
    if (eq <= 0 || !section) continue
    let value = line.slice(eq + 1).trim()
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    } else {
      const hash = value.search(/[#;]/) // 未加引号时 # / ; 起注释作用
      if (hash >= 0) value = value.slice(0, hash).trim()
    }
    out[section + line.slice(0, eq).trim().toLowerCase()] = value
  }
  return out
}

/** 直读 .git/config；成功返回白名单键值对象，读不到返回 null（交给子进程兜底） */
function readLiveFromFile() {
  const dir = gitDir()
  if (!dir) return null
  try {
    const map = parseIniConfig(readFileSync(join(dir, 'config'), 'utf8'))
    const live = {}
    for (const key of GIT_KEYS) live[key] = map[key.toLowerCase()] || '' // 未设置 → 空串（前端据此回落）
    return live
  } catch {
    return null
  }
}

/** 兜底：一条 git 命令拿全量 local config */
function fetchLiveConfigViaGit() {
  return git(['config', '--local', '--list']).then(({ stdout }) => {
    const map = {}
    for (const line of String(stdout).split(/\r?\n/)) {
      const eq = line.indexOf('=')
      if (eq <= 0) continue
      map[line.slice(0, eq).trim().toLowerCase()] = line.slice(eq + 1).trim()
    }
    const live = {}
    for (const key of GIT_KEYS) live[key] = map[key.toLowerCase()] || ''
    return live
  })
}

function refreshLiveConfig() {
  if (liveCache.inflight) return liveCache.inflight
  liveCache.inflight = fetchLiveConfigViaGit()
    .then((v) => {
      liveCache.value = v
      liveCache.at = Date.now()
      liveCache.inflight = null
      return v
    })
    .catch((e) => {
      liveCache.inflight = null
      throw e
    })
  return liveCache.inflight
}

function invalidateLiveConfig() {
  liveCache.value = null
  liveCache.at = 0
}

export function readGitConfigLive() {
  const direct = readLiveFromFile()
  if (direct) return Promise.resolve(direct) // 主路径：文件读，约 1ms，永远是最新值

  // 兜底路径（起进程，慢）才需要缓存
  if (liveCache.value && Date.now() - liveCache.at < LIVE_TTL) return Promise.resolve(liveCache.value)
  const pending = refreshLiveConfig().catch(() => liveCache.value || {})
  if (liveCache.value) return Promise.resolve(liveCache.value) // 有旧值：先用旧值，后台刷新
  return pending
}

/**
 * 保存配置：写入 git.config.local 并逐条应用到仓库 local config
 * 写盘后并发执行（异步，不阻塞事件循环），全部完成才返回。
 * @param {{[k: string]: string}} entries 键值对（只接受白名单 key）
 * @returns {Promise<{applied: string[]}>} 实际应用的 key 列表
 */
export async function saveGitConfig(entries) {
  if (!entries || typeof entries !== 'object') throw new Error('参数格式错误')
  const clean = {}
  for (const [k, v] of Object.entries(entries)) {
    if (!keyAllowed(k)) throw new Error(`不允许设置的配置项: ${k}`)
    if (!valueOk(v)) throw new Error(`配置项 ${k} 的值非法（需为单行非空文本）`)
    clean[k] = v.trim()
  }

  // 1) 写文件（保留原文件里白名单外的手工行，避免误删）
  const existing = existsSync(CONFIG_FILE) ? readFileSync(CONFIG_FILE, 'utf8').split(/\r?\n/) : []
  const foreign = existing.filter((l) => {
    const t = l.trim()
    if (!t || t.startsWith('#')) return true
    const eq = t.indexOf('=')
    return eq > 0 && !keyAllowed(t.slice(0, eq).trim())
  })
  const body = Object.entries(clean).map(([k, v]) => `${k}=${v}`)
  writeFileSync(CONFIG_FILE, [...FILE_HEADER, ...foreign, ...body, ''].join('\n'), 'utf8')

  // 2) 并发应用到仓库 local config（保存即生效）；13 秒超时给足 git 启动慢的余量
  const applied = Object.keys(clean)
  await Promise.all(applied.map((k) => git(['config', k, clean[k]], { timeout: 13_000 })))
  invalidateLiveConfig() // 生效值已变，缓存作废
  return { applied }
}

/* ---------- GitHub 推送凭证（PAT） ----------
 * Token 只写入用户主目录的凭证库 ~/.git-credentials（credential.helper=store 的标准落点，
 * 与第一次 push 手工输入后的存放位置完全一致），在用户主目录、与仓库无关，永不上传。
 * API 永不回显 token，只返回「已配置 / 未配置」状态。 */

/** 在 git.config.local 里 upsert 一行（用于记录 github.username 等非 git 配置元数据） */
function upsertFileLine(key, value) {
  const lines = existsSync(CONFIG_FILE) ? readFileSync(CONFIG_FILE, 'utf8').split(/\r?\n/) : []
  const target = `${key}=${value}`
  let found = false
  const out = lines.map((l) => {
    if (!found && l.trim().startsWith(key + '=')) { found = true; return target }
    return l
  })
  if (!found) out.push(target)
  writeFileSync(CONFIG_FILE, out.join('\n').replace(/\n*$/, '\n'), 'utf8')
}

/** 凭证状态：hasToken 是否已配置 PAT；username 记录的 GitHub 用户名（非敏感） */
export function readGithubCredStatus() {
  let hasToken = false
  try {
    hasToken = existsSync(CRED_FILE) && readFileSync(CRED_FILE, 'utf8').split(/\r?\n/).some((l) => l.indexOf('@github.com') !== -1)
  } catch { /* 读取失败按未配置处理 */ }
  const f = readGitConfigFile()
  return { hasToken, username: f['github.username'] || '' }
}

/**
 * 保存 GitHub 推送凭证（PAT）：写入 ~/.git-credentials 并记录用户名
 * @param {string} token PAT（ghp_ / github_pat_ 等，禁止空格与 URL 特殊字符）
 * @param {string} [username] GitHub 账号名；缺省时从 origin 远程地址自动解析
 * @returns {Promise<{username: string}>}
 */
export async function saveGithubToken(token, username) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,255}$/.test(token)) {
    throw new Error('Token 格式不对：GitHub PAT 通常以 ghp_ 或 github_pat_ 开头，不能含空格')
  }
  let user = (username || '').trim()
  if (!user) {
    try {
      const { stdout } = await git(['remote', 'get-url', 'origin'])
      const m = String(stdout).trim().match(/github\.com[/:]([^/]+)/)
      if (m) user = m[1]
    } catch { /* 没有 origin 时报用户名缺失 */ }
  }
  if (!/^[A-Za-z0-9-]{1,39}$/.test(user)) throw new Error('GitHub 用户名缺失或格式不对')

  // 合并写入凭证库：保留其他条目，替换 github.com 旧条目
  const lines = existsSync(CRED_FILE) ? readFileSync(CRED_FILE, 'utf8').split(/\r?\n/).filter((l) => l.trim()) : []
  const kept = lines.filter((l) => l.indexOf('@github.com') === -1)
  kept.push(`https://${user}:${token}@github.com`)
  writeFileSync(CRED_FILE, kept.join('\n') + '\n', 'utf8')
  try { chmodSync(CRED_FILE, 0o600) } catch { /* Windows 下权限位无意义，忽略 */ }

  upsertFileLine('github.username', user)
  return { username: user }
}

/**
 * 实测凭证可用性：用存储的凭证跑 git ls-remote origin（与 push 完全相同的鉴权链路，
 * 同时覆盖 helper / http.version / 代理等真实环境），比调 GitHub API 更贴近推送实战
 * 异步执行：这条最慢（联网 + 30 秒超时），绝不能用同步版把后台按死半分钟。
 * @returns {Promise<{ok: boolean, kind: string, message: string}>}
 */
export async function verifyGithubCred() {
  if (!readGithubCredStatus().hasToken) {
    return { ok: false, kind: 'missing', message: '尚未配置凭证' }
  }
  try {
    await git(['ls-remote', '--heads', 'origin'], { timeout: 30_000 })
    return { ok: true, kind: 'ok', message: '凭证可用，已通过远程仓库鉴权' }
  } catch (e) {
    const err = String((e.stderr || '') + (e.stdout || '') + (e.message || ''))
    if (/authentication|401|403|permission denied/i.test(err)) {
      return { ok: false, kind: 'auth', message: '凭证无效或无此仓库权限，请重新生成 PAT 并保存' }
    }
    if (e.killed || /timed out|ETIMEDOUT/i.test(err)) {
      return { ok: false, kind: 'network', message: '验证超时（30 秒），检查代理后重试' }
    }
    if (/could not resolve|failed to connect|timeout|ssl|tls|proxy/i.test(err)) {
      return { ok: false, kind: 'network', message: '网络不通（凭证未测到），检查代理后重试' }
    }
    const first = err.trim().split('\n')[0] || '未知错误'
    return { ok: false, kind: 'unknown', message: '验证失败：' + first.slice(0, 120) }
  }
}
