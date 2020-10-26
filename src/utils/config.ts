/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';
import * as fs from 'fs-extra';
import ensureUserPermissionsDeveloperEdition = require('../../config/ensureUserPermissionsDeveloperEdition.json');
import ensureObjectPermissionsDeveloperEdition = require('../../config/ensureObjectPermissionsDeveloperEdition.json');

const CONFIG_DEFAULTS = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ensureUserPermissions: ensureUserPermissionsDeveloperEdition.ensureUserPermissions,
  ensureObjectPermissions: ensureObjectPermissionsDeveloperEdition.ensureObjectPermissions,
  moveSourceFolders: [],
  sourceFix: [],
};

// Path to resolved config object.
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

  // // Allow users to override certain scripts
  // const config = Object.assign({}, defaults, configFromFile, {
  //   scripts: Object.assign({}, defaults.scripts || {}, configFromFile.script || {}),
  //   husky: Object.assign({}, defaults.husky || {}, configFromFile.husky || {}),
  // });

  const config = {
    ...configFromFile,
    ensureUserPermissions: configFromFile.ensureUserPermissions || defaults.ensureUserPermissions,
    ensureObjectPermissions: configFromFile.ensureObjectPermissions || defaults.ensureObjectPermissions,
    moveSourceFolders: configFromFile.moveSourceFolders || defaults.moveSourceFolders,
    sourceFix: configFromFile.sourceFix || defaults.sourceFix,
  };

  resolvedConfigs[path] = config;
  return config;
};
