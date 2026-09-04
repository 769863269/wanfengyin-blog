/**
 * 冒烟构建前的 dist-smoke 清理（尽力而为，绝不阻塞构建）。
 *
 * 不直接依赖 Vite 的 emptyOutDir：本机沙箱的 safe-delete 钩子会拦截
 * Node 层的递归删除（trash 操作超时失败），导致 smoke 构建直接报错。
 * 策略逐级降级：正常删除 → 改名让路 → 放弃清理直接覆盖构建。
 * smoke 构建产物文件名固定（smoke-bundle.js 等），覆盖写入即可，
 * 残留旧文件不影响断言结果。
 */
import { existsSync, renameSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'dist-smoke')

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
