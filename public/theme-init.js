/**
 * 首屏防闪：在 Vue 挂载前同步应用主题，避免深色模式白屏闪烁。
 * 独立外链文件（非内联）：让 CSP 可以收紧到 script-src 'self'，无内联脚本可注入。
 */
;(function () {
  try {
    var saved = localStorage.getItem('night')
    var dark =
      saved === '1' ||
      (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('night')
  } catch (e) {
    /* localStorage 不可用时静默降级为浅色 */
  }
})()
