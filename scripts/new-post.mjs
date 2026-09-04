/**
 * 新建文章脚手架
 *
 * 用法：npm run new -- "文章标题" [--slug my-slug] [--tags 标签1,标签2]
 *
 * 生成 articles/<今天日期>-<slug>.md，frontmatter 齐全、文件名规范，
 * 拿到手只改正文就能发。slug 缺省用 post-日期，建议发布前改成有意义的英文。
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const articlesDir = join(root, 'articles')

const args = process.argv.slice(2)
const title = args.find((arg, i) => i === 0 && !arg.startsWith('--'))

function optionValue(name) {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

if (!title) {
  console.error('用法: npm run new -- "文章标题" [--slug my-slug] [--tags 前端,Vue]')
  process.exit(1)
}

const slug = optionValue('slug') || `post-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`
const tags = (optionValue('tags') || '随笔')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean)

const today = new Date().toISOString().slice(0, 10)
const fileName = `${today}-${slug}.md`
const filePath = join(articlesDir, fileName)

if (existsSync(filePath)) {
  console.error(`[new] 文件已存在: articles/${fileName}`)
  process.exit(1)
}

const content = `---
slug: ${slug}
title: ${title}
excerpt: 在这里写一两句话摘要，会显示在列表和搜索结果里。
publishedAt: ${today}
tags: [${tags.join(', ')}]
cover: /images/covers/your-cover.jpg # 有图就换成文件名，没图删掉本行
views: 0
commentCount: 0
---

在这里开始写正文。

## 第一个小节

## 是小节标题的会自动进文章目录，写 2 个以上标题才会显示目录卡。

代码块用三反引号包起来并标注语言，构建时自动高亮：

\`\`\`ts
const greeting = 'hello blog'
\`\`\`
`

writeFileSync(filePath, content, 'utf8')
console.log(`[new] 已创建 articles/${fileName}`)
console.log('[new] 下一步：编辑内容 → npm run pub 发布')
