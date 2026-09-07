/**
 * Studio CMS 数据层隔离测试（不起服务、不碰 git）。运行：npm run test:studio
 * 用独立测试 slug，结束前全部进回收站并彻底清除。
 */
import {
  createArticle, getArticle, updateArticle, changeStatus, setFlags,
  trashArticle, restoreFromTrash, purgeTrash, listTrash,
  renameTaxonomy, queryArticles, statusCounts, runSchedule, roleOf,
} from './store.mjs'

// 随机后缀：避免与本机正在运行的 studio 调度器或上次崩溃残留抢 slug
const S = 'cms-layer-test-' + String(Date.now() % 1000000)
let failed = 0
const assert = (name, cond, extra) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' | ' + extra : ''))
  if (!cond) failed++
}

// 0. 自愈预清理：上次运行若有残留（崩溃等），先扫掉
for (const a of queryArticles({ q: 'cms-layer-test' })) {
  try {
    const t = trashArticle(a.file, 'test-preclean')
    purgeTrash(t.trashName)
  } catch { /* 文件可能已被并发清走 */ }
}

// 0. 自愈预清理：上次运行若有残留（崩溃等），先扫掉
for (const a of queryArticles({ q: 'cms-layer-test' })) {
  try {
    const t = trashArticle(a.file, 'test-preclean')
    purgeTrash(t.trashName)
  } catch { /* 文件可能已被并发清走 */ }
}

// 1. 创建（draft）
let f = createArticle({ title: 'CMS数据层测试', slug: S, content: '## 测试\n\n正文', status: 'draft', author: '周周', category: '测试分类', tags: ['测试标签'], keywords: ['kw1', 'kw2'], publishAt: '2020-01-01 00:00' }).file
assert('创建草稿', f === `2026-09-07-${S}.md` || f.endsWith(`-${S}.md`), f)

let a = getArticle(f)
assert('读取字段完整', a.status === 'draft' && a.category === '测试分类' && a.keywords.join() === 'kw1,kw2' && a.author === '周周')

// 2. 状态机
changeStatus(f, 'review'); a = getArticle(f)
assert('draft→review', a.status === 'review')
changeStatus(f, 'published'); a = getArticle(f)
assert('review→published（定时字段清空）', a.status === 'published' && a.publishAt === '')
changeStatus(f, 'offline'); a = getArticle(f)
assert('published→offline', a.status === 'offline')
let bad = false
try { changeStatus(f, 'review'); } catch { bad = true }
assert('非法流转被拦截（offline→review）', bad)
changeStatus(f, 'published')

// 3. flags
setFlags(f, { pinned: true, featured: true })
a = getArticle(f)
assert('置顶+推荐', a.pinned === true && a.featured === true)
setFlags(f, { pinned: false, featured: false })
a = getArticle(f)
assert('取消置顶+推荐', a.pinned === false && a.featured === false)
setFlags(f, { pinned: true, featured: true })
a = getArticle(f)
assert('再置顶', a.pinned === true && a.featured === true)

// 4. 更新 + 改名（slug 变更）
const r = updateArticle(f, { slug: S + '-2', excerpt: '新摘要' })
a = getArticle(r.file)
assert('更新+改名', r.renamed && a.slug === S + '-2' && a.excerpt === '新摘要' && a.pinned === true)
f = r.file

// 5. 查询
const hit = queryArticles({ q: '新摘要' })
assert('关键词搜索命中', hit.some((x) => x.file === f))
const byCat = queryArticles({ category: '测试分类' })
assert('分类筛选命中', byCat.some((x) => x.file === f))

// 6. 回收站往返
trashArticle(f, '周周')
assert('删除后列表不存在', !getArticle(f))
assert('回收站可见', listTrash().some((t) => t.slug === S + '-2'))
const restored = restoreFromTrash(listTrash().find((t) => t.slug === S + '-2').trashName, '周周')
assert('恢复', Boolean(getArticle(restored.file)))

// 7. taxonomy 重命名（只影响测试文章）
const rn = renameTaxonomy('category', '测试分类', '测试分类改')
assert('分类重命名', rn.changed.includes(restored.file) && getArticle(restored.file).category === '测试分类改')
renameTaxonomy('tag', '测试标签', '测试标签改')
assert('标签重命名', getArticle(restored.file).tags.includes('测试标签改'))

// 8. 定时调度（publishAt 在过去 → draft 直接翻 published）
const f2 = createArticle({ title: '定时测试', slug: S + '-sched', content: 'x'.repeat(10), status: 'draft', author: '周周', publishAt: '2020-01-01 08:00' }).file
const flipped = runSchedule()
assert('定时发布翻转', flipped.some((x) => x.file === f2) && getArticle(f2).status === 'published')

// 9. 权限与作者
assert('角色解析', roleOf('周周') === 'admin' && roleOf('不存在的人') === 'guest')

// 10. 计数
const counts = statusCounts()
assert('计数包含测试文章', counts.all > 0 && counts.published > 0)

// 清理：全部进回收站 + 彻底删除
for (const file of [restored.file, f2]) {
  const t = trashArticle(file, '测试清理')
  purgeTrash(t.trashName)
}
assert('清理完成', !listTrash().some((t) => t.slug.startsWith(S)) && !queryArticles({ q: S }).length)
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
