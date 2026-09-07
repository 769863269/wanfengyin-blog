/**
 * Studio 管理界面 Tailwind 预编译配置。
 *
 * 性能背景：页面原先用 451KB 浏览器版构建（scripts/studio-assets/tailwind.js），
 * MutationObserver 在每次 DOM 更新时全量重扫重编译，交互明显卡顿。
 * 改为构建期用 CLI 预编译成静态 studio.css，页面 <link> 引入，运行时零编译开销。
 *
 * 重新编译（page.mjs 改了类名后执行一次）：
 *   node <workbuddy-node-workspace>/node_modules/tailwindcss/lib/cli.js \
 *     -c scripts/studio/tailwind.config.cjs \
 *     -o scripts/studio-assets/studio.css --minify
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [require('path').join(__dirname, 'page.mjs')],
  theme: { extend: {} },
  corePlugins: { preflight: true },
}
