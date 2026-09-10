#!/usr/bin/env node
/**
 * 应用本地 git 配置（git.config.local → 仓库 local config）
 *
 * 用途：跨电脑克隆后一键恢复本项目的 git 偏好（HTTP/1.1、提交身份等），
 * 配置文件本身被 .gitignore 排除，永不上传 GitHub。
 *
 * 自动生成：若 git.config.local 不存在，从 git.config.local.example 自动生成，
 * 身份优先取全局 git 配置（git config --global），没有则保留占位值，
 * 提示去 Studio「系统设置 → Git 推送配置」填写。占位值不会应用到仓库。
 *
 * 用法：
 *   npm run setup:git          # 手动应用
 *   npm run dev / studio       # 已挂 pre 钩子，启动时自动应用
 *
 * 文件格式（每行一条，# 开头为注释）：
 *   http.version=HTTP/1.1
 *   user.name=你的名字
 *   user.email=you@example.com
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'git.config.local')
const example = join(root, 'git.config.local.example')

/** 占位值：未填真实身份前不应用到仓库 config */
const PLACEHOLDERS = new Set(['你的名字', 'you@example.com'])

function globalConfig(key) {
  try {
    return execFileSync('git', ['config', '--global', '--', key], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

if (!existsSync(file)) {
  // 自动生成：优先用 example 模板，没有就用内置默认模板
  let content = existsSync(example)
    ? readFileSync(example, 'utf8')
    : '# 本项目本地 git 配置（不入库，不上传 GitHub）\nhttp.version=HTTP/1.1\nuser.name=你的名字\nuser.email=you@example.com\n'

  // 全局身份存在则预填，免去手工填写
  const gName = globalConfig('user.name')
  const gEmail = globalConfig('user.email')
  if (gName) content = content.replace(/^user\.name=.*$/m, `user.name=${gName}`)
  if (gEmail) content = content.replace(/^user\.email=.*$/m, `user.email=${gEmail}`)
  writeFileSync(file, content, 'utf8')

  if (gName || gEmail) {
    console.log('[setup:git] 已自动生成 git.config.local（身份取自全局 git 配置）')
  } else {
    console.log('[setup:git] 已自动生成 git.config.local（身份为占位值，请在后台「系统设置 → Git 推送配置」填写）')
  }
}

const lines = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

const applied = []
for (const line of lines) {
  const eq = line.indexOf('=')
  if (eq <= 0) continue
  const key = line.slice(0, eq).trim()
  const value = line.slice(eq + 1).trim()
  if (!key || !value) continue
  if (PLACEHOLDERS.has(value)) {
    console.warn(`[setup:git] ${key} 仍是占位值，未应用——请在后台「系统设置 → Git 推送配置」填写真实身份`)
    continue
  }
  try {
    execFileSync('git', ['config', key, value], { cwd: root })
    applied.push(`${key}=${value}`)
  } catch {
    console.warn(`[setup:git] 应用失败，跳过: ${key}`)
  }
}

if (applied.length) {
  console.log(`[setup:git] 已应用 ${applied.length} 项本地 git 配置:`)
  applied.forEach((l) => console.log('  ' + l))
}
