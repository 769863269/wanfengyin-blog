import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-smoke/**',
      'node_modules/**',
      'legacy-static/**',
      'public/**',
      '*.d.ts',
      '*.config.js',
      '*.config.ts',
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
