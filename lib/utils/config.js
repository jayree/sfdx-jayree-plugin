/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import fs from 'fs-extra';
import isDocker from 'is-docker';
import isWsl from 'is-wsl';
import { SfProject } from '@salesforce/core';
const CONFIG_DEFAULTS = {
    ensureUserPermissions: [],
    ensureObjectPermissions: [],
    moveSourceFolders: [],
    applySourceFixes: ['source:retrieve:full', 'source:retrieve:all'],
    runHooks: false,
    puppeteerDocker: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process'],
    },
    puppeteerWSL: {
        headless: true,
        executablePath: '/bin/google-chrome',
    },
    puppeteer: {
        headless: true,
    },
};
const resolvedConfigs = {};
export default (path = SfProject.resolveProjectPathSync()) => {
    if (path && resolvedConfigs[path]) {
        return resolvedConfigs[path];
    }
    const defaults = CONFIG_DEFAULTS;
    let configFromFile;
    try {
        configFromFile = fs.readJsonSync(join(path, '.sfdx-jayree.json'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            configFromFile = {};
        }
        else {
            throw error;
        }
    }
    if (configFromFile.puppeteer && isDocker()) {
        configFromFile.puppeteer = { ...defaults.puppeteerDocker, ...configFromFile.puppeteer };
    }
    if (configFromFile.puppeteer && isWsl) {
        configFromFile.puppeteer = { ...defaults.puppeteerWSL, ...configFromFile.puppeteer };
    }
    const config = {
        ...configFromFile,
        ensureUserPermissions: configFromFile.ensureUserPermissions || defaults.ensureUserPermissions,
        ensureObjectPermissions: configFromFile.ensureObjectPermissions || defaults.ensureObjectPermissions,
        moveSourceFolders: configFromFile.moveSourceFolders || defaults.moveSourceFolders,
        applySourceFixes: configFromFile.applySourceFixes || defaults.applySourceFixes,
        runHooks: configFromFile.runHooks || defaults.runHooks,
        puppeteer: configFromFile.puppeteer ||
            (isWsl && defaults.puppeteerWSL) ||
            (isDocker() && defaults.puppeteerDocker) ||
            defaults.puppeteer,
    };
    resolvedConfigs[path] = config;
    return config;
};
//# sourceMappingURL=config.js.map