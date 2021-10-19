module.exports = {
  plugins: ['eslint-plugin-header'],
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
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'header/header': [
      2,
      'block',
      [
        '',
        {
          pattern: ' \\* Copyright \\(c\\) \\d{4}, jayree',
          template: ' * Copyright (c) 2021, jayree',
        },
        ' * All rights reserved.',
        ' * Licensed under the BSD 3-Clause license.',
        ' * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause',
        ' ',
      ],
    ],
  },
};
