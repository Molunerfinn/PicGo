module.exports = {
  root: true,
  globals: {
    __static: 'readonly'
  },
  env: {
    node: true
  },
  parser: "vue-eslint-parser",
  'extends': [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript'
  ],
  'plugins': ['@typescript-eslint'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'off' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "indent": "off",
    "@typescript-eslint/indent": ["error", 2]
  },
  parserOptions: {
    parser: '@typescript-eslint/parser'
  }
}
