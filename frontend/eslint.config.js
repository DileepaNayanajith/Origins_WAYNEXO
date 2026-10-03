import globals from 'globals'
import hooks from 'eslint-plugin-react-hooks'
export default [{ files: ['src/**/*.{js,jsx}'], linterOptions: { reportUnusedDisableDirectives: false }, plugins: { 'react-hooks': hooks }, languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.es2022 } }, rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-keys': 'error' } }]
