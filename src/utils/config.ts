/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import * as fs from 'fs-extra';
import isDocker from 'is-docker';
import { SfdxProject } from '@salesforce/core';
import * as ensureUserPermissionsDeveloperEdition from '../../config/ensureUserPermissionsDeveloperEdition.json';
import * as ensureObjectPermissionsDeveloperEdition from '../../config/ensureObjectPermissionsDeveloperEdition.json';

const CONFIG_DEFAULTS = {
  ensureUserPermissions: ensureUserPermissionsDeveloperEdition.ensureUserPermissions,
  ensureObjectPermissions: ensureObjectPermissionsDeveloperEdition.ensureObjectPermissions,
  moveSourceFolders: [],
  applySourceFixes: ['source:retrieve:full', 'source:retrieve:all'],
  runHooks: false,
  puppeteerDocker: {
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-gpu'],
  },
  puppeteer: {
    headless: true,
  },
};

const resolvedConfigs = {};

export default (path = SfdxProject.resolveProjectPathSync()) => {
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

  if (configFromFile.puppeteer && isDocker()) {
    configFromFile.puppeteer = { ...defaults.puppeteerDocker, ...configFromFile.puppeteer };
  }

  const config = {
    ...configFromFile,
    ensureUserPermissions: configFromFile.ensureUserPermissions || defaults.ensureUserPermissions,
    ensureObjectPermissions: configFromFile.ensureObjectPermissions || defaults.ensureObjectPermissions,
    moveSourceFolders: configFromFile.moveSourceFolders || defaults.moveSourceFolders,
    applySourceFixes: configFromFile.applySourceFixes || defaults.applySourceFixes,
    runHooks: configFromFile.runHooks || defaults.runHooks,
    puppeteer: configFromFile.puppeteer || (isDocker() && defaults.puppeteerDocker) || defaults.puppeteer,
  };

  resolvedConfigs[path] = config;
  return config;
};
