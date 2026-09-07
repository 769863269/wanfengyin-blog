/**
 * frontmatter 序列化 —— parseFrontmatter（markdown.mjs）的逆操作
 *
 * 只生成解析器支持的 YAML 子集：「key: value」标量与「key: [a, b]」数组简写。
 * 规则：
 *   - undefined / null / 空字符串 / 空数组 → 不输出该字段
 *   - 含特殊字符（引号/冒号/逗号等）的值用单引号包裹（解析端会剥掉成对引号）
 *   - 数组项内不允许逗号（解析端按逗号切分），序列化前清洗
 */

function cleanScalar(value) {
  return String(value).replaceAll(/\s+/g, ' ').trim()
}

function quoteIfNeeded(value) {
  const s = cleanScalar(value)
  if (s === '') return "''"
  if (/^['"[]{}#&*!|>%@`]|:\s|\s:|[,:]$/.test(s)) {
    return `'${s.replaceAll("'", "''")}'`
  }
  return s
}

function cleanItem(value) {
  // 数组项不能带逗号（解析端按逗号切分），换成顿号保语义
  return cleanScalar(value).replaceAll(',', '，').replaceAll("'", '')
}

/**
 * data（普通对象）+ markdown 正文 → 完整 .md 文件内容。
 * 字段按传入对象顺序输出，调用方负责把常用字段排前面。
 */
export function stringifyFrontmatter(data, body) {
  const lines = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      const items = value.map(cleanItem).filter(Boolean)
      if (!items.length) continue
      lines.push(`${key}: [${items.map(quoteIfNeeded).join(', ')}]`)
      continue
    }
    const s = cleanScalar(value)
    if (s === '') continue
    lines.push(`${key}: ${quoteIfNeeded(s)}`)
  }
  lines.push('---', '', String(body ?? '').replace(/\r\n/g, '\n').trim(), '')
  return lines.join('\n')
}
