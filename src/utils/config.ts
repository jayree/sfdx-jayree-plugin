/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import * as fs from 'fs-extra';
import * as ensureUserPermissionsDeveloperEdition from '../../config/ensureUserPermissionsDeveloperEdition.json';
import * as ensureObjectPermissionsDeveloperEdition from '../../config/ensureObjectPermissionsDeveloperEdition.json';

const CONFIG_DEFAULTS = {
  ensureUserPermissions: ensureUserPermissionsDeveloperEdition.ensureUserPermissions,
  ensureObjectPermissions: ensureObjectPermissionsDeveloperEdition.ensureObjectPermissions,
  moveSourceFolders: [],
  applySourceFixes: ['source:retrieve:full', 'source:retrieve:all'],
  runHooks: false,
};

const resolvedConfigs = {};

export default (path) => {
  if (path && resolvedConfigs[path]) {
    return resolvedConfigs[path];
  }

  const defaults = CONFIG_DEFAULTS;
  let configFromFile;
  try {
    configFromFile = fs.readJsonSync(join(path, '.sfdx-jayree.json'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      configFromFile = {};
    } else {
      throw error;
    }
  }

  const config = {
    ...configFromFile,
    ensureUserPermissions: configFromFile.ensureUserPermissions || defaults.ensureUserPermissions,
    ensureObjectPermissions: configFromFile.ensureObjectPermissions || defaults.ensureObjectPermissions,
    moveSourceFolders: configFromFile.moveSourceFolders || defaults.moveSourceFolders,
    applySourceFixes: configFromFile.applySourceFixes || defaults.applySourceFixes,
    runHooks: configFromFile.runHooks || defaults.runHooks,
  };

  resolvedConfigs[path] = config;
  return config;
};
