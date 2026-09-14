/**
 * 冒烟构建前的 dist-smoke 清理（尽力而为，绝不阻塞构建）。
 *
 * 不直接依赖 Vite 的 emptyOutDir：本机沙箱的 safe-delete 钩子会拦截
 * Node 层的递归删除（trash 操作超时失败），导致 smoke 构建直接报错。
 * 策略逐级降级：正常删除 → 改名让路 → 放弃清理直接覆盖构建。
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
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'dist-smoke')

// 先回收历史遗留的 .old-* 目录（尽力而为，失败静默跳过）
for (const name of readdirSync(root)) {
  if (!name.startsWith('dist-smoke.old-')) continue
  try {
    rmSync(join(root, name), { recursive: true, force: true })
    console.log(`[smoke] 已回收历史遗留目录 ${name}`)
  } catch {
    /* safe-delete 拦截时留着，不影响构建 */
  }
}

if (!existsSync(dir)) {
  console.log('[smoke] dist-smoke 不存在，跳过清理')
} else {
  try {
    rmSync(dir, { recursive: true, force: true })
    console.log('[smoke] dist-smoke 已清理')
  } catch {
    try {
      const trash = `${dir}.old-${Date.now()}`
      renameSync(dir, trash)
      console.log(`[smoke] 删除被拦截，旧目录已改名为 ${trash}（可手动删除）`)
    } catch {
      console.warn('[smoke] dist-smoke 被进程锁定，跳过清理，直接覆盖构建')
    }
  }
}
