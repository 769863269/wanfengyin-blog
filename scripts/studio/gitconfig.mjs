/**
 * 本地 git 配置的读写与应用（Studio「系统设置 → Git 推送配置」的服务层）
 *
 * 数据流：后台表单 → git.config.local（gitignore 排除，永不上传 GitHub）
 *        → 同步写入本仓库 local config（git config <key> <value>），保存即生效
 *
 * 安全边界：
 * - key 白名单：只允许操作下面这几项，防止把任意 git 配置（如 core.hooksPath）当跳板
 * - value 校验：单行、无控制字符、不以 - 开头（防被当 flag）；execFileSync 参数数组传递，无 shell 注入面
 */
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ROOT } from './store.mjs'

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

/** 读当前仓库 local config 的实际生效值（白名单 key 全量探测） */
export function readGitConfigLive() {
  const live = {}
  for (const key of GIT_KEYS) {
    try {
      live[key] = execFileSync('git', ['config', '--local', '--', key], { cwd: ROOT, encoding: 'utf8' }).trim()
    } catch {
      live[key] = '' // 该项未设置
    }
  }
  return live
}

/**
 * 保存配置：写入 git.config.local 并逐条应用到仓库 local config
 * @param {{[k: string]: string}} entries 键值对（只接受白名单 key）
 * @returns {{applied: string[]}} 实际应用的 key 列表
 */
export function saveGitConfig(entries) {
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

  // 2) 应用到仓库 local config（保存即生效）
  const applied = []
  for (const [k, v] of Object.entries(clean)) {
    execFileSync('git', ['config', k, v], { cwd: ROOT })
    applied.push(k)
  }
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
 * @returns {{username: string}}
 */
export function saveGithubToken(token, username) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,255}$/.test(token)) {
    throw new Error('Token 格式不对：GitHub PAT 通常以 ghp_ 或 github_pat_ 开头，不能含空格')
  }
  let user = (username || '').trim()
  if (!user) {
    try {
      const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' }).trim()
      const m = url.match(/github\.com[/:]([^/]+)/)
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
