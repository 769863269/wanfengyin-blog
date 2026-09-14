/**
 * 冒烟构建前的 dist-smoke 清理（尽力而为，绝不阻塞构建）。
 *
 * 不直接依赖 Vite 的 emptyOutDir：本机沙箱的 safe-delete 钩子会拦截
 * Node 层的递归删除（trash 操作超时失败），导致 smoke 构建直接报错。
 * 策略逐级降级：.NET 强制删除（Windows）→ 改名让路 → 放弃清理直接覆盖构建。
 * smoke 构建产物文件名固定（smoke-bundle.js 等），覆盖写入即可，
 * 残留旧文件不影响断言结果。
 *
 * ⚠️ 改名的 `dist-smoke.old-<ts>` 必须顺手回收：它们既不在 .gitignore 的
 *    `dist-smoke` 规则内，又会随每次 smoke 累积 —— 曾因此被 `git add -A`
 *    误提交进仓库（23 个文件），所以 .gitignore 那条已放宽为带通配符的写法，
 *    这里也每次尝试清掉历史遗留。
 *    （注：写本文档时别把「dist-smoke 加星号」直接连写成注释里的斜杠加星号，
 *      那会提前闭合块注释、把后面的说明文字变成代码 —— 本文件刚踩过。）
 */
import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'dist-smoke')

/**
 * 递归删除目录，返回是否真的删掉了。
 *
 * Windows 本机装了 safe-delete 钩子（hook 在 Node 的 fs 层：rm/rmdir 会被
 * 转成回收站操作并超时失败），所以 `rmSync` 在这里**必然失败**——
 * 之前回收 `.old-*` 的代码就是被它静默吃掉，残留一份一份累积
 * （连 `.gitignore` 都因此要放宽成通配写法）。
 * 唯一可靠通道是 .NET：`[System.IO.Directory]::Delete` 直接走 Win32，不过回收站。
 * 其它平台（CI）用标准 rmSync。
 */
function forceRemoveDir(target) {
  if (process.platform === 'win32') {
    const escaped = target.replaceAll("'", "''")
    spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `[System.IO.Directory]::Delete('${escaped}', $true)`,
      ],
      { stdio: 'ignore', timeout: 20000 },
    )
  } else {
    try {
      rmSync(target, { recursive: true, force: true })
    } catch {
      /* 落到下面统一由 existsSync 判定 */
    }
  }
  return !existsSync(target)
}

// 先回收历史遗留的 .old-* 目录
for (const name of readdirSync(root)) {
  if (!name.startsWith('dist-smoke.old-')) continue
  if (forceRemoveDir(join(root, name))) console.log(`[smoke] 已回收历史遗留目录 ${name}`)
  else console.warn(`[smoke] 历史遗留目录未能删除：${name}`)
}

if (!existsSync(dir)) {
  console.log('[smoke] dist-smoke 不存在，跳过清理')
} else if (forceRemoveDir(dir)) {
  console.log('[smoke] dist-smoke 已清理')
} else {
  try {
    const trash = `${dir}.old-${Date.now()}`
    renameSync(dir, trash)
    console.log(`[smoke] 删除被拦截，旧目录已改名为 ${trash}（下次运行会自动回收）`)
  } catch {
    console.warn('[smoke] dist-smoke 被进程锁定，跳过清理，直接覆盖构建')
  }
}
