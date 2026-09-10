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
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { ROOT } from './store.mjs'

const CONFIG_FILE = join(ROOT, 'git.config.local')

/** 允许在后台设置的 git 配置项白名单 */
export const GIT_KEYS = ['http.version', 'user.name', 'user.email', 'core.autocrlf', 'pull.rebase', 'push.default']

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
