import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      // 通配写法：clean-smoke 删不掉产物时会改名成 dist-smoke.old-<ts>，
      // 写精确名 dist-smoke 会漏掉它们（minified bundle 一次性刷出上百条 error）。
      // 与 .gitignore 的 dist-smoke*、.prettierignore 的 dist-smoke*/ 保持一致。
      'dist*/**',
      'node_modules/**',
      'public/**',
      '*.d.ts',
      '*.config.js',
      '*.config.ts',
      'scripts/studio-assets/**',
      'scripts/**/*.tmp.mjs',
      'scripts/**/*.tmp.cjs',
      'scripts/.trash-tmp/**',
      '.studio/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },

  {
    files: ['**/*.vue'],
    rules: {
      // 单文件组件统一使用 <script setup> + TypeScript
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': 'warn',
      'vue/require-default-prop': 'off',
    },
  },

  {
    // ArticleBody 是全项目唯一允许 v-html 的地方：每个注入点都过 sanitizeHtml
    // （DOMPurify），或来自构建期白名单产物（Shiki 高亮 codeHtml）。
    //
    // 这里用文件级关闭，而不是就地写 20 处 eslint-disable-next-line：
    // 逐行抑制是按行生效的，prettier 一旦把标签折成多行，v-html 就掉出抑制范围，
    // 规则静默复活报警（且只是 warning，不会让 lint 失败，极易无人察觉）。
    files: ['src/components/article/ArticleBody.vue'],
    rules: {
      'vue/no-v-html': 'off',
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },

  {
    // Node 脚本（冒烟测试、工具脚本）输出到终端是本职工作
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
)
