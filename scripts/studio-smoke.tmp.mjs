import { JSDOM } from 'jsdom'

const errors = []
const dom = await JSDOM.fromURL('http://127.0.0.1:5199/', {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse(window) {
    // jsdom 不实现 fetch：桥接到 Node 原生 fetch（相对路径补全）
    window.fetch = (url, opts) =>
      globalThis.fetch(new URL(String(url), 'http://127.0.0.1:5199/').href, opts)
  },
})
dom.window.addEventListener('error', (e) => {
  const msg = String(e.error || e.message || '')
  if (!msg.includes('tailwind.js')) errors.push(msg) // tailwind CDN 构建在 jsdom 的 observer 噪音忽略
})

await new Promise((r) => setTimeout(r, 1500))

const $ = (id) => dom.window.document.getElementById(id)
const assert = (name, cond) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name)
  if (!cond) process.exitCode = 1
}

assert('页面元素渲染', $('publish') && $('panel') && $('steps'))
assert('date 默认今天', $('date').value === new Date().toISOString().slice(0, 10))

// 字数统计
$('content').value = 'hello 正文'
$('content').dispatchEvent(new dom.window.Event('input'))
assert('字数统计', $('wordCount').textContent.includes('字'))

// slug 建议
$('title').value = 'Hello World Test'
$('title').dispatchEvent(new dom.window.Event('input'))
assert('slug 建议', $('slug').placeholder === 'hello-world-test')

// 已发布列表加载（fetch 桥接验证）
await new Promise((r) => setTimeout(r, 600))
assert('文章列表加载', $('artCount').textContent.includes('篇') && $('artList').children.length > 0)

// 空标题+空正文点发布 → 后端 400 → 终端红字 + 错误横幅
$('publish').click()
await new Promise((r) => setTimeout(r, 900))
assert('校验拦截显示', $('log').textContent.includes('标题和正文都不能为空'))
assert('错误横幅', !$('banner').classList.contains('hidden') && $('banner').textContent.includes('❌'))
assert('按钮恢复可用', !$('publish').disabled && $('btnText').textContent === '发布')

// dry-run 完整流（真实任务 + 轮询 + 步骤条）
$('title').value = 'Studio Smoke Dry'
$('content').value = '## 测试\n\n正文'
$('dryRun').checked = true
$('publish').click()
await new Promise((r) => setTimeout(r, 5000))
const stepText = $('steps').textContent
assert('dry-run 成功横幅', $('banner').textContent.includes('预演完成'))
assert('推送步骤标记跳过', $('banner').textContent.includes('未提交、未推送'))
assert('步骤条渲染', stepText.includes('写入文章') && stepText.includes('推送上线'))
assert('按钮恢复可用', !$('publish').disabled)
assert('无页面 JS 错误', errors.length === 0)
if (errors.length) console.log('ERRORS:', errors)

process.exit(process.exitCode || 0)
