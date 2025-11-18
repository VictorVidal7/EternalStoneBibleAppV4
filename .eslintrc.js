module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  rules: {
    // TypeScript específico
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // React específico
    'react/react-in-jsx-scope': 'off', // No necesario en React 17+
    'react/prop-types': 'off', // Usamos TypeScript
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off', // Permitimos texto directo

    // Calidad general
    'no-console': ['warn', {allow: ['warn', 'error']}],
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-unused-vars': 'off', // Usamos la versión de TypeScript
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
