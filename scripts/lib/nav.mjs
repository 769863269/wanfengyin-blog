/**
 * 自定义页面「可达性」判定 —— 前台构建与后台共用同一套规则
 *
 * 规则：页面前台可访问 ⟺ status = published 且（开启直接访问 或 被导航菜单引用）
 *
 *   - 草稿（draft）           → 前台一律 404
 *   - 已发布 + directAccess   → /page/<slug> 任何人可打开（可分享链接）
 *   - 已发布 + 在菜单里       → 从前台菜单可进入
 *   - 已发布，两者都没有      → 不注册路由 → /page/<slug> 走 404（"发布了但没上线"）
 *
 * 菜单引用 = content/site.json 的 mainNav 中 kind='route' 的 target
 *（导航已合并为「全通用」，web 顶栏与 H5 抽屉同一份列表；旧配置里独立的
 *  mobileExtraNav 仍会被读取，避免历史配置的页面突然掉线）。
 * 这套判定必须被 build-pages.mjs（决定是否注册路由）与 store.mjs（后台列表展示、
 * 保存后提示）共用，否则会出现「后台说能开、前台 404」这类不一致。
 */

/** frontmatter 的值都是字符串，`directAccess: true` 解析后是 'true'，两种写法都要认 */
export function isTrue(value) {
  return value === true || value === 'true'
}

/** 从 site.json 里取出所有被导航菜单引用的 slug（mainNav 为全通用列表，mobileExtraNav 为旧配置兼容）
 *  支持递归 children：子菜单里的 route 引用同样算数；hidden 项整枝（含子级）不算 —— 分支都不渲染，引用自然失效 */
export function navReferencedSlugs(site) {
  const slugs = new Set()
  for (const list of [site?.mainNav, site?.mobileExtraNav]) {
    if (!Array.isArray(list)) continue
    walk(list)
  }
  function walk(list) {
    for (const item of list) {
      if (!item) continue
      if (item.kind === 'hidden') continue // 整枝跳过：父项隐藏则子级也不渲染
      if (item.kind === 'route') {
        const target = String(item.target ?? '').trim()
        if (target) slugs.add(target)
      }
      if (Array.isArray(item.children)) walk(item.children)
    }
  }
  return slugs
}

/**
 * 页面是否前台可达。
 * @param {{ slug: string, status?: string, directAccess?: unknown }} page 页面信息（含 slug）
 * @param {Set<string>} navSlugs navReferencedSlugs() 的结果
 */
export function isPageReachable(page, navSlugs) {
  if ((page?.status ?? 'published') !== 'published') return false
  if (isTrue(page?.directAccess)) return true
  return navSlugs.has(String(page?.slug ?? ''))
}
