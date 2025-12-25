const globals = require('globals')
const path = require('node:path')
const eslintJs = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const importPlugin = require('eslint-plugin-import')
const promisePlugin = require('eslint-plugin-promise')
const vuePlugin = require('eslint-plugin-vue')

const isProduction = process.env.NODE_ENV === 'production'
const vueConfigs = vuePlugin.configs['flat/recommended'].map(config => ({
  ...config,
  languageOptions: {
    ...(config.languageOptions || {}),
    parserOptions: {
      ...(config.languageOptions?.parserOptions || {}),
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      extraFileExtensions: ['.vue']
    }
  }
}))

const tsConfigs = tsPlugin.configs['flat/recommended'].map(config => ({
  ...config,
  files: config.files || ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  languageOptions: {
    ...(config.languageOptions || {}),
    parser: tsParser,
    parserOptions: {
      ...(config.languageOptions?.parserOptions || {}),
      ecmaVersion: 'latest',
      sourceType: 'module',
      extraFileExtensions: ['.vue'],
      project: path.join(__dirname, 'tsconfig.json'),
      tsconfigRootDir: __dirname
    }
  },
  rules: {
    ...(config.rules || {}),
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none'
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-empty-object-type': 'off'
  }
}))

module.exports = [
  {
    ignores: [
      'dist/**',
      'dist_electron/**',
      'build/**',
      'test/unit/coverage/**',
      'test/unit/*.js',
      'test/e2e/*.js',
      'node_modules/**'
    ]
  },
  {
    name: 'eslint/base',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        __static: 'readonly'
      }
    },
    plugins: {
      import: importPlugin,
      promise: promisePlugin
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.vue']
        }
      }
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...promisePlugin.configs.recommended.rules,
      'import/named': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'promise/catch-or-return': 'off',
      'promise/always-return': 'off',
      'no-console': 'off',
      'no-debugger': isProduction ? 'error' : 'off',
      'no-async-promise-executor': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': 'off'
    }
  },
  ...vueConfigs,
  {
    files: ['*.vue', '**/*.vue'],
    rules: {
      'vue/no-v-html': 'off',
      'vue/attribute-hyphenation': 'off'
    }
  },
  ...tsConfigs,
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      'no-undef': 'off'
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-var': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    // 1. 针对所有 JS 文件（或者特定目录）启用 Node 全局变量
    files: ["**/*.js", "scripts/*.js"], 
    languageOptions: {
      globals: {
        ...globals.node, // 注入 process, require, module, __dirname 等
        ...globals.browser // 如果你的项目是前端项目，可能还需要 browser
      },
      sourceType: "commonjs" // 如果你的项目代码主要是 CJS，加上这个；如果是 ESM 则设为 "module"
    }
  },
]
