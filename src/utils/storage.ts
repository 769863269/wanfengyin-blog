/**
 * localStorage 键注册表 + 统一访问层
 *
 * 为什么集中到一处：
 *   主题键曾同时写在 useTheme.ts 与 public/theme-init.js 两处。后者是首屏防闪脚本，
 *   必须在 Vue 挂载前同步执行，无法 import 模块 —— 两边一旦漂移，就会出现
 *   「首屏按旧键判成浅色、挂载后被 composable 改回深色」的闪烁。
 *   现在 TS 侧一律只认这里的定义；theme-init.js 里那份字面量由
 *   tests/storage-keys.test.ts 断言兜住（漂移即测试失败，而不是等用户看到闪烁）。
 *
 * 键名规范：统一 `wf:` 前缀（应用级命名空间），子键用 `:` 继续分段。
 * 旧键通过 legacy 声明，首次读取时自动迁移并把值搬过去，用户偏好不重置。
 */

export interface StorageKey {
  /** 当前键名 */
  readonly key: string
  /** 历史键名：首次读取时把值搬到新键并删除旧键，只发生一次 */
  readonly legacy?: string
}

/** 全部持久化键的唯一注册表。业务代码禁止出现字面量键名，一律引用这里的条目。 */
export const STORAGE = {
  /** 夜间模式：'1' 深色 / '0' 浅色 / 不存在 = 跟随系统 */
  theme: { key: 'wf:theme', legacy: 'night' },
  /** 本机阅读统计：slug → 阅读次数 */
  viewStats: { key: 'wf:view-stats', legacy: 'wanfengyin:view-stats' },
} as const satisfies Record<string, StorageKey>

/**
 * 由注册表条目派生子键（同一命名空间下），legacy 一并派生。
 * 例：derivedKey(STORAGE.viewStats, 'last-at') → { key: 'wf:view-stats:last-at', legacy: 'wanfengyin:view-stats:last-at' }
 */
export function derivedKey(base: StorageKey, suffix: string): StorageKey {
  return base.legacy
    ? { key: `${base.key}:${suffix}`, legacy: `${base.legacy}:${suffix}` }
    : { key: `${base.key}:${suffix}` }
}

/**
 * 读取。命中旧键时顺带完成迁移。
 * localStorage 不可用（隐私模式、配额满）时返回 null，绝不抛错。
 */
export function readStored(entry: StorageKey): string | null {
  try {
    const current = localStorage.getItem(entry.key)
    if (current !== null) return current
    if (!entry.legacy) return null

    const old = localStorage.getItem(entry.legacy)
    if (old === null) return null

    // 迁移：搬到新键、清掉旧键，之后不再走这条分支
    localStorage.setItem(entry.key, old)
    localStorage.removeItem(entry.legacy)
    return old
  } catch {
    return null
  }
}

/** 写入。返回是否成功 —— 调用方需要据此决定「动态生效」还是「退回静态兜底」 */
export function writeStored(entry: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(entry.key, value)
    return true
  } catch {
    return false
  }
}

/** 删除（含旧键，避免迁移时旧值复活） */
export function removeStored(entry: StorageKey): void {
  try {
    localStorage.removeItem(entry.key)
    if (entry.legacy) localStorage.removeItem(entry.legacy)
  } catch {
    /* 忽略：删不掉也不影响功能 */
  }
}
