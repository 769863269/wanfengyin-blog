import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sortedPosts } from './src/data/posts'
import { domain } from './src/config/site'

/**
 * 构建时生成 sitemap.xml
 *
 * 文章列表来自 src/data/posts.ts —— 单一数据源，新增文章自动进入 sitemap，
 * 不需要像原静态版那样手工同步（原版的 sitemap 因此早已过期）。
 * 域名占位时同样生成，上线前在 config/site.ts 改 domain 即可。
 */
function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    generateBundle() {
      const urls = [
        { loc: `${domain}/`, lastmod: undefined },
        ...sortedPosts.map((post) => ({
          loc: `${domain}/post/${post.slug}`,
          lastmod: post.publishedAt,
        })),
      ]
        .map(({ loc, lastmod }) =>
          [
            '  <url>',
            `    <loc>${loc}</loc>`,
            ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
            '  </url>',
          ].join('\n'),
        )
        .join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
    },
  }
}

export default defineConfig({
  plugins: [vue(), sitemapPlugin()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    open: false,
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    /** 旧产物残留会导致 index.html 引用与实际不一致，每次构建强制清空 */
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown 只接受函数形式 manualChunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue-router') || /[\\/]vue[\\/]/.test(id)) return 'vue'
          }
        },
      },
    },
  },
})
