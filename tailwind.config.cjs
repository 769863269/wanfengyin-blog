/** @type {import('tailwindcss').Config} */
// Studio 后台样式源：扫描 page.mjs（模板字符串里的类名同样会被提取）
// 重新生成：npm run studio:css → scripts/studio-assets/studio.css
module.exports = {
  content: ['./scripts/studio/page.mjs'],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: true,
  },
}
