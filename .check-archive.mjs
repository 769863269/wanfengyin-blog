import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = process.cwd()
const shell = readFileSync(resolve(root, 'dist-smoke/index.html'), 'utf8')
const bundle = readFileSync(resolve(root, 'dist-smoke/smoke-bundle.js'), 'utf8')

const vc = new VirtualConsole()
const polyfill = '<script>window.scrollTo=function(){};window.process=window.process||{env:{NODE_ENV:"production"}}</script></head>'
const bundleTag = '<script>' + bundle.replace(/<\/script>/gi, '<\\/script>') + '</script></body>'
const html = shell
  .replace(/<script[^>]*type="module"[^>]*><\/script>/g, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
  .replace('</head>', polyfill)
  .replace('</body>', bundleTag)

const dom = new JSDOM(html, { url: 'http://localhost:5173/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc })
await new Promise((r) => setTimeout(r, 1500))
const doc = dom.window.document
const win = dom.window

// 1. 进归档页：点导航里的归档链接
const navArchive = [...doc.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/archives')
navArchive?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }))
await new Promise((r) => setTimeout(r, 600))
const backBtn = doc.querySelector('.archive__back')
const yearGroups = doc.querySelectorAll('.archive__year').length
console.log('archive back button:', Boolean(backBtn), '| text:', backBtn?.textContent.trim())
console.log('year groups:', yearGroups)

// 2. 点返回 → 回到首页
backBtn?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }))
await new Promise((r) => setTimeout(r, 600))
console.log('after back, home cards:', doc.querySelectorAll('.post-card').length > 0)

// 3. 波浪线 CSS 生效检查（取第一条卡片的 after 伪元素背景）
const styleEl = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n')
console.log('wave svg in css:', styleEl.includes('data:image/svg+xml'))
console.log('emoji wave gone:', !styleEl.includes('\u3030\uFE0F'))
