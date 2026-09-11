/**
 * 封面图批量转 WebP（按需运行，不进构建链）
 *
 * 用法：
 *   npm i -D sharp
 *   node scripts/optimize-images.mjs             # 只生成 .webp，报告压缩比，不动任何引用
 *   node scripts/optimize-images.mjs --rewrite   # 额外把 articles/ 与 content/ 里的引用改成 .webp
 *
 * 为什么不做成构建/上传时自动转：sharp 是原生依赖，装它会拖慢换机器时的
 * npm install（还可能编译失败）。本站图片量很小（十几张、单张 30–50KB），
 * 手动跑一次就够本。原图一律保留，改引用前请自行确认站点能正常显示。
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const coversDir = join(root, 'public', 'images', 'covers')
const REWRITE = process.argv.includes('--rewrite')
const QUALITY = 80
const SOURCE_EXTS = ['.jpg', '.jpeg', '.png']

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('[images] 未安装 sharp。先执行：npm i -D sharp')
  process.exit(1)
}

const files = readdirSync(coversDir).filter((f) => SOURCE_EXTS.includes(extname(f).toLowerCase()))
if (!files.length) {
  console.log('[images] 没有可转换的 jpg/png 封面')
  process.exit(0)
}

let beforeTotal = 0
let afterTotal = 0
const converted = []

for (const file of files) {
  const src = join(coversDir, file)
  const out = join(coversDir, basename(file, extname(file)) + '.webp')
  const before = statSync(src).size

  await sharp(src).webp({ quality: QUALITY }).toFile(out)

  const after = statSync(out).size
  beforeTotal += before
  afterTotal += after
  converted.push({ file: basename(out), before, after })
  console.log(
    `[images] ${file} → ${basename(out)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`,
  )
}

const saved = beforeTotal - afterTotal
console.log(
  `\n[images] ${converted.length} 张转换完成：${(beforeTotal / 1024).toFixed(0)}KB → ${(afterTotal / 1024).toFixed(0)}KB` +
    `（省 ${(saved / 1024).toFixed(0)}KB，${((saved / beforeTotal) * 100).toFixed(0)}%）`,
)

if (!REWRITE) {
  console.log('[images] 引用未改动。确认效果后加 --rewrite 重跑，或手工替换为 .webp')
  process.exit(0)
}

/* ---------- 把文章/页面里的 .jpg/.png 封面引用改成 .webp ---------- */

const webpNames = new Set(converted.map((c) => c.file))
const targets = []

for (const dir of [join(root, 'articles'), join(root, 'content', 'pages')]) {
  try {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.md')) targets.push(join(dir, f))
    }
  } catch {
    /* 目录不存在就跳过 */
  }
}

let touched = 0
for (const file of targets) {
  const raw = readFileSync(file, 'utf8')
  // 逐个替换：只改「同名 .webp 已生成」的路径，未转换的图片保持原样
  const next = raw.replaceAll(/\/images\/covers\/([A-Za-z0-9._-]+)\.(jpe?g|png)/g, (match, stem) => {
    const candidate = `${stem}.webp`
    return webpNames.has(candidate) ? `/images/covers/${candidate}` : match
  })
  if (next !== raw) {
    writeFileSync(file, next, 'utf8')
    touched++
    console.log(`[images] 引用已更新：${file.replace(root + '\\', '').replace(root + '/', '')}`)
  }
}

console.log(`\n[images] ${touched} 个文件的引用已切到 WebP。记得重新构建（npm run build）验证。`)
