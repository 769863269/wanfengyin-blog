/**
 * 头部配置一致性校验
 *
 * 背景：站点的响应头有**两份源**，各自服务不同平台 ——
 *   - vercel.json        → Vercel（当前线上，实测唯一生效的那份）
 *   - public/_headers    → Netlify / Cloudflare Pages（备用路径）
 *
 * 两份文件头部都写了「改一处要改两处」，但注释拦不住人。这个脚本把约定变成检查：
 * 逐条比对两边相同作用域的 CSP 指令与关键安全头，任何一边漏改都会让它退出码非 0，
 * 可以挂进 CI 或提交前手动跑一次。
 *
 * 用法：node scripts/check-headers.mjs
 *   一致 → 打印摘要并 exit 0；不一致 → 打印差异并 exit 1。
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const vercelFile = join(root, 'vercel.json')
const netlifyFile = join(root, 'public', '_headers')

/** 作用域映射：vercel.json 的 source 用 (.*) 正则，_headers 用 * 通配，语义等价 */
const SCOPES = [
  { name: '全站', vercel: '/(.*)', netlify: '/*' },
  { name: '完整 HTML 独立页', vercel: '/page-html/(.*)', netlify: '/page-html/*' },
]

/** 需要逐字节对齐的响应头（其余头（如 Cache-Control）不参与比对） */
const COMPARED_HEADERS = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]

/** CSP 归一化：按 `;` 拆指令 → 去空白 → 排序，忽略书写顺序差异 */
function normalizeCsp(value) {
  return String(value)
    .split(';')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort()
    .join(';\n  ')
}

/** 解析 vercel.json → { sourcePattern: { HeaderName: value } } */
function readVercel() {
  const cfg = JSON.parse(readFileSync(vercelFile, 'utf8'))
  const out = new Map()
  for (const rule of cfg.headers ?? []) {
    const map = new Map()
    for (const h of rule.headers ?? []) map.set(h.key, String(h.value))
    out.set(rule.source, map)
  }
  return out
}

/**
 * 解析 public/_headers（Netlify 格式）→ { pattern: { HeaderName: value } }
 * 规则：空行与 `#` 注释跳过；顶格行 = 新的作用域；缩进行 = `Key: value`。
 */
function readNetlify() {
  const text = readFileSync(netlifyFile, 'utf8')
  const out = new Map()
  let current = null
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue
    if (/^\s/.test(raw)) {
      if (!current) continue
      const idx = raw.indexOf(':')
      if (idx < 0) continue
      current.map.set(raw.slice(0, idx).trim(), raw.slice(idx + 1).trim())
    } else {
      current = { pattern: raw.trim(), map: new Map() }
      out.set(current.pattern, current.map)
    }
  }
  return out
}

const vercel = readVercel()
const netlify = readNetlify()
const problems = []
let checked = 0

for (const scope of SCOPES) {
  const v = vercel.get(scope.vercel)
  const n = netlify.get(scope.netlify)

  if (!v) {
    problems.push(`[${scope.name}] vercel.json 缺少作用域 "${scope.vercel}"`)
    continue
  }
  if (!n) {
    problems.push(`[${scope.name}] public/_headers 缺少作用域 "${scope.netlify}"`)
    continue
  }

  for (const key of COMPARED_HEADERS) {
    const vv = v.get(key)
    const nn = n.get(key)
    checked++
    if (!vv && !nn) continue
    if (!vv) {
      problems.push(`[${scope.name}] ${key}：vercel.json 没有，public/_headers 有`)
      continue
    }
    if (!nn) {
      problems.push(`[${scope.name}] ${key}：public/_headers 没有，vercel.json 有`)
      continue
    }
    const a = key === 'Content-Security-Policy' ? normalizeCsp(vv) : vv
    const b = key === 'Content-Security-Policy' ? normalizeCsp(nn) : nn
    if (a !== b) {
      problems.push(`[${scope.name}] ${key} 两边不一致：\n  vercel.json     : ${vv}\n  public/_headers : ${nn}`)
    }
  }
}

if (problems.length) {
  console.error('[headers] 头部配置不一致（两处必须同步改）：\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error('\n[headers] 改完记得两个文件都改：vercel.json 与 public/_headers')
  process.exit(1)
}

console.log(
  `[headers] OK：${SCOPES.length} 个作用域 / ${checked} 项响应头在 vercel.json 与 public/_headers 完全一致`,
)
