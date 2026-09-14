/**
 * 自定义页面 slug 规则 —— 构建端（build-pages.mjs）与后台（studio/store.mjs）唯一实现
 *
 * 为什么必须共用一份：
 *   先前两边各写了一个逐字相同的 SLUG_RE，但保留字表（RESERVED_SLUGS）只存在于后台。
 *   结果是「后台拒绝、构建放行」——手工在 content/pages/ 下丢一个保留字 slug（如 blog.md），
 *   构建会照常注册路由，与内置路由潜在冲突。这类分叉不会立刻报错，只会在某次单边修改后静默出现。
 *
 * 改动此文件即同时作用于前后两端，不要再在别处复制正则或保留字表。
 */

/** 内置路由 name（与 src/router/index.ts 一致），自定义页面不得占用 */
export const BUILTIN_ROUTES = ['home', 'archive', 'tags', 'about', 'random']

/** 保留 slug：与内置路由 / 关键路径冲突的禁止使用 */
export const RESERVED_SLUGS = [...BUILTIN_ROUTES, 'post', 'page', 'admin', 'api', 'assets', 'feed']

/** 小写字母 / 数字 / 连字符，以字母或数字开头，最长 50 字符 */
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,49}$/

/**
 * 校验 slug，不合法即抛错。
 * 调用方决定怎么呈现：后台直接抛给用户看；构建端 catch 后走 fail() 退出。
 *
 * @param {string} slug
 */
export function assertSlug(slug) {
  if (!SLUG_RE.test(slug)) {
    throw new Error('slug 只能是小写字母 / 数字 / 连字符，且以字母或数字开头（最长 50 字符）')
  }
  if (RESERVED_SLUGS.includes(slug)) {
    throw new Error(`slug "${slug}" 是保留字，请换一个`)
  }
}
