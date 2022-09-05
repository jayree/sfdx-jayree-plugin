/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { SfProject } from '@salesforce/core';
import kit from '@salesforce/kit';
import config from '../utils/config.js';

export const runHooks = (() => {
  try {
    return (
      Boolean(config(SfProject.resolveProjectPathSync()).runHooks) &&
      !kit.env.getBoolean('SFDX_DISABLE_JAYREE_HOOKS', false)
    );
  } catch (error) {
    return false;
  }
})();
