/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Generated - Do not modify. Controlled by @salesforce/dev-scripts
// See more at https://github.com/forcedotcom/sfdx-dev-packages/tree/master/packages/dev-scripts

module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'plugin:sf-plugin/migration', 'plugin:prettier/recommended'],
  plugins: ['eslint-plugin-header'],
  ignorePatterns: ['**/*.d.ts', '**/*.cjs'],
  rules: {
    'header/header': [
      2,
      'block',
      [
        '',
        {
          pattern: ' \\* Copyright \\(c\\) \\d{4}, jayree',
          template: ' * Copyright (c) 2023, jayree',
        },
        ' * All rights reserved.',
        ' * Licensed under the BSD 3-Clause license.',
        ' * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause',
        ' ',
      ],
    ],
  },
};
