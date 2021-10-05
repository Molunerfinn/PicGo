module.exports = {
  root: true,
  globals: {
    __static: 'readonly'
  },
  env: {
    node: true
  },
  parser: 'vue-eslint-parser',
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript',
    'prettier-standard'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'off' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: 'off',
    camelcase: 'warn',
    'no-eval': 'warn',
    'no-template-curly-in-string': 'warn',
    'no-use-before-define': 'off',
    'no-async-promise-executor': 'off',
    'no-tabs': 'warn',
    'func-call-spacing': 'warn',
    'no-unexpected-multiline': 'warn',
    'no-undef': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/issues/2621#issuecomment-701970389
    'no-unused-vars': 'off'
  },
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  overrides: [
    {
      files: ['**/**.d.ts'],
      rules: {
        'no-var': 'off'
      }
    }
  ]
}
