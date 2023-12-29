module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
  },
  rules: {
    "@typescript-eslint/no-floating-promises": "error"
  },
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
