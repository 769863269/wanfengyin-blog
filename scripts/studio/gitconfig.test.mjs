/**
 * gitconfig 层测试（不起服务、不写任何用户配置）。
 * 运行：node scripts/studio/gitconfig.test.mjs   （或 npm run test:studio:git）
 *
 * 存在的理由：这里曾经有一个把整个后台按死的性能 bug ——
 * readGitConfigLive() 用 execFileSync 逐 key 探测 7 次，本机每次 spawn git 约 2 秒，
 * 于是 /api/git-config 稳定耗时 12~17 秒，并且同步阻塞事件循环：
 * 实测 /api/articles 平时 7ms，被挡住时变成 12000ms（整个后台切菜单全部卡住）。
 * 下面第 1 组断言就是防止有人再把它写回同步版本。
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseIniConfig, readGitConfigLive, GIT_KEYS } from './gitconfig.mjs'
import { ROOT } from './store.mjs'

let failed = 0
const assert = (name, cond, extra) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' | ' + extra : ''))
  if (!cond) failed++
}

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'gitconfig.mjs'), 'utf8')

console.log('\n[1] 性能契约：绝不允许同步 git 子进程')
// 注释里为了记录教训会提到 execFileSync，所以先剥掉注释再查真实代码
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
assert('代码中无 execFileSync', code.indexOf('execFileSync') === -1)
assert('代码中无 execSync', code.indexOf('execSync') === -1)
assert('代码中无 spawnSync', code.indexOf('spawnSync') === -1)
assert('使用异步 execFile + promisify', code.indexOf('promisify(execFile)') !== -1)
assert('git 调用带超时（防等锁挂死）', /timeout:\s*\d+/.test(code))

console.log('\n[2] INI 解析（等价于 git config --local 的取值）')
const ini = [
  '[core]',
  '\trepositoryformatversion = 0',
  '',
  '# 这是注释',
  '; 这也是注释',
  '[remote "origin"]',
  '\turl = https://github.com/x/y.git',
  '[branch "main"]',
  '\tremote = origin',
  '[http]',
  '\tversion = HTTP/1.1   # 行尾注释',
  '[USER]',
  '\tName = WillowEcho',
  '\temail = "willowecho@163.com"',
  '',
].join('\n')
const parsed = parseIniConfig(ini)
assert('[section] 取值', parsed['core.repositoryformatversion'] === '0')
assert('忽略 # 与 ; 注释行', parsed['#'] === undefined && parsed[';'] === undefined)
assert('section 名大小写不敏感（[USER] → user.*）', parsed['user.name'] === 'WillowEcho')
assert('key 名大小写不敏感（Name → name）', parsed['user.name'] === 'WillowEcho')
assert('去掉行尾注释', parsed['http.version'] === 'HTTP/1.1', parsed['http.version'])
assert('去引号（双引号包裹的值）', parsed['user.email'] === 'willowecho@163.com', parsed['user.email'])
assert('subsection 归入 section 本身（不影响白名单键）', parsed['branch.remote'] === 'origin')
assert('未出现的 key 取不到', parsed['pull.rebase'] === undefined)

console.log('\n[3] 真实仓库取值：与 git config --local --list 对账')
let live = {}
let resolves = false
try {
  live = await readGitConfigLive()
  resolves = true
} catch (e) {
  assert('readGitConfigLive 返回 Promise 且不抛错', false, e.message)
}
assert('返回 Promise（可直接 await）', resolves)
assert('白名单 key 全部存在', GIT_KEYS.every((k) => typeof live[k] === 'string'))
assert('user.name 已读到', !!live['user.name'], live['user.name'])
assert('user.email 已读到', !!live['user.email'], live['user.email'])

// 用 git 本体做一次对账（测试里允许同步，仅用于取真值）
try {
  const out = execFileSync('git', ['config', '--local', '--list'], { cwd: ROOT, encoding: 'utf8' })
  const oracle = {}
  for (const line of out.split(/\r?\n/)) {
    const eq = line.indexOf('=')
    if (eq > 0) oracle[line.slice(0, eq).trim().toLowerCase()] = line.slice(eq + 1).trim()
  }
  const diff = GIT_KEYS.filter((k) => (oracle[k] || '') !== live[k])
  assert('与 git config --local 逐 key 一致', diff.length === 0, diff.length ? '不一致: ' + diff.join(', ') : '')
} catch (e) {
  console.log('SKIP 对账（git 不可用）：' + e.message.split('\n')[0])
}

console.log('\n[4] 缓存：第二次调用应瞬时返回')
const t0 = performance.now()
await readGitConfigLive()
const warm = performance.now() - t0
assert('第二次调用 < 50ms', warm < 50, Math.round(warm) + 'ms')

console.log(failed ? `\n${failed} FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
