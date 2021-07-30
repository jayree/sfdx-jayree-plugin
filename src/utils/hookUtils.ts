/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { SfdxProject } from '@salesforce/core';
import * as kit from '@salesforce/kit';
import config from '../utils/config';

export const runHooks = (() => {
  try {
    return (
      Boolean(config(SfdxProject.resolveProjectPathSync()).runHooks) &&
      !kit.env.getBoolean('SFDX_DISABLE_JAYREE_HOOKS', false)
    );
  } catch (error) {
    return false;
  }
})();
