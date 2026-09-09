/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

/** scripts/lib/markdown.mjs：构建侧与渲染端共用的行内 Markdown 渲染（先转义再挂白名单标签，受控 HTML） */
declare module '*/markdown.mjs' {
  export function renderInline(text: string): string
}
