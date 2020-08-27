module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'eslint-config-salesforce-license'],
  rules: {
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowAny: true,
        allowNullish: true,
        allowBoolean: true,
        allowNumber: true,
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
