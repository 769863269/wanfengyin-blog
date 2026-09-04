import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 冒烟测试专用构建配置
 *
 * jsdom 不执行 `<script type="module">`，所以测试包必须打成 IIFE 单文件：
 * - inlineDynamicImports：把所有懒加载路由内联，保证路由可测
 * - minify: false：产物可读，断言失败时好排查
 * 运行方式：`npm run smoke`（见 scripts/smoke.mjs）
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-smoke',
    // 清理由 scripts/clean-smoke.mjs 负责：本机 safe-delete 钩子会拦截
    // emptyOutDir 的递归删除导致构建报错，这里关闭自动清空。
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'smoke-bundle.js',
        assetFileNames: 'smoke-[name][extname]',
      },
    },
  },
})
