import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE, derivedKey, readStored, removeStored, writeStored } from '@/utils/storage'

/**
 * localStorage 键的一致性防线
 *
 * public/theme-init.js 是首屏防闪脚本，必须在 Vue 之前同步执行，无法 import
 * 注册表 —— 所以它是全项目唯一一份「手写的键名字面量」。这个文件存在的意义
 * 就是盯着它：一旦有人改了 src/utils/storage.ts 的键却忘了同步那边，
 * 测试直接失败，而不是等用户看到「首屏浅色、挂载后跳深色」的闪烁。
 */

const initScriptPath = fileURLToPath(new URL('../public/theme-init.js', import.meta.url))
const initScript = readFileSync(initScriptPath, 'utf8')

/** 从首屏脚本里抠出它实际使用的键名（不关心格式，只关心字面量） */
function literalOf(name: string): string {
  const match = new RegExp(`${name}\\s*=\\s*['"]([^'"]+)['"]`).exec(initScript)
  if (!match?.[1]) throw new Error(`public/theme-init.js 里找不到 ${name} 的字面量`)
  return match[1]
}

/** 一个够用的 localStorage 替身：记录调用、可模拟配额溢出 */
function createStorage(overrides: Partial<Storage> = {}): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
    ...overrides,
  } as Storage
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('注册表与首屏脚本的键名一致性', () => {
  it('主题键与 public/theme-init.js 相同', () => {
    expect(literalOf('KEY')).toBe(STORAGE.theme.key)
  })

  it('主题旧键与 public/theme-init.js 相同', () => {
    expect(literalOf('LEGACY_KEY')).toBe(STORAGE.theme.legacy)
  })

  it('所有键都带 wf: 前缀（统一命名空间）', () => {
    for (const entry of Object.values(STORAGE)) {
      expect(entry.key.startsWith('wf:')).toBe(true)
    }
  })

  it('旧键不得与新键重名（否则迁移会自己搬自己）', () => {
    for (const entry of Object.values(STORAGE)) {
      expect(entry.legacy).not.toBe(entry.key)
    }
  })
})

describe('derivedKey', () => {
  it('派生子键且旧键一并派生', () => {
    expect(derivedKey(STORAGE.viewStats, 'last-at')).toEqual({
      key: 'wf:view-stats:last-at',
      legacy: 'wanfengyin:view-stats:last-at',
    })
  })

  it('无旧键时只给新键', () => {
    expect(derivedKey({ key: 'wf:plain' }, 'sub')).toEqual({ key: 'wf:plain:sub' })
  })
})

describe('读取与迁移', () => {
  it('命中新键时原样返回，不动旧键', () => {
    const store = createStorage()
    store.setItem(STORAGE.theme.key, '1')
    store.setItem(STORAGE.theme.legacy, '0')
    vi.stubGlobal('localStorage', store)

    expect(readStored(STORAGE.theme)).toBe('1')
    expect(store.getItem(STORAGE.theme.legacy)).toBe('0')
  })

  it('只有旧键时搬过来并清掉旧键', () => {
    const store = createStorage()
    store.setItem(STORAGE.theme.legacy, '1')
    vi.stubGlobal('localStorage', store)

    expect(readStored(STORAGE.theme)).toBe('1')
    expect(store.getItem(STORAGE.theme.key)).toBe('1')
    expect(store.getItem(STORAGE.theme.legacy)).toBeNull()
  })

  it('两处都没有时返回 null', () => {
    vi.stubGlobal('localStorage', createStorage())
    expect(readStored(STORAGE.theme)).toBeNull()
  })

  it('localStorage 抛错时静默降级为 null', () => {
    vi.stubGlobal(
      'localStorage',
      createStorage({
        getItem: () => {
          throw new Error('SecurityError: 隐私模式')
        },
      }),
    )
    expect(readStored(STORAGE.theme)).toBeNull()
  })
})

describe('写入与删除', () => {
  it('写入成功返回 true', () => {
    const store = createStorage()
    vi.stubGlobal('localStorage', store)
    expect(writeStored(STORAGE.theme, '0')).toBe(true)
    expect(store.getItem(STORAGE.theme.key)).toBe('0')
  })

  it('写入失败返回 false（调用方据此退回静态兜底）', () => {
    vi.stubGlobal(
      'localStorage',
      createStorage({
        setItem: () => {
          throw new Error('QuotaExceededError')
        },
      }),
    )
    expect(writeStored(STORAGE.theme, '0')).toBe(false)
  })

  it('删除会连旧键一起清掉，避免迁移时旧值复活', () => {
    const store = createStorage()
    store.setItem(STORAGE.theme.key, '1')
    store.setItem(STORAGE.theme.legacy, '1')
    vi.stubGlobal('localStorage', store)

    removeStored(STORAGE.theme)
    expect(store.getItem(STORAGE.theme.key)).toBeNull()
    expect(store.getItem(STORAGE.theme.legacy)).toBeNull()
  })
})
