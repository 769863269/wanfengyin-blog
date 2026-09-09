#!/usr/bin/env node
/**
 * 应用本地 git 配置（git.config.local → 仓库 local config）
 *
 * 用途：跨电脑克隆后一键恢复本项目的 git 偏好（HTTP/1.1、提交身份等），
 * 配置文件本身被 .gitignore 排除，永不上传 GitHub。
 *
 * 用法：
 *   npm run setup:git          # 手动应用
 *   npm run dev / studio       # 已挂 pre 钩子，启动时自动静默应用
 *
 * 文件格式（每行一条，# 开头为注释）：
 *   http.version=HTTP/1.1
 *   user.name=你的名字
 *   user.email=you@example.com
 */
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'git.config.local')

if (!existsSync(file)) {
  // 静默跳过：新电脑还没建配置文件时不报错、不阻塞启动
  process.exit(0)
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
