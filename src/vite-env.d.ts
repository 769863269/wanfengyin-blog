/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

/** scripts/lib/markdown.mjs：构建侧与渲染端共用的 Markdown 渲染与 HTML 片段净化（白名单唯一来源） */
declare module '*/markdown.mjs' {
  export function renderInline(text: string): string
  /** HTML 片段可用标签白名单（sanitize.ts 与生成端共用的唯一来源） */
  export const HTML_TAG_ALLOWLIST: string[]
  /** HTML 片段可用属性白名单（含 style，值另有 url()/表达式过滤） */
  export const HTML_ATTR_ALLOWLIST: string[]
}
