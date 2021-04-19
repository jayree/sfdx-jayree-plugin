"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path_1 = require("path");
const fs = tslib_1.__importStar(require("fs-extra"));
const ensureUserPermissionsDeveloperEdition = tslib_1.__importStar(require("../../config/ensureUserPermissionsDeveloperEdition.json"));
const ensureObjectPermissionsDeveloperEdition = tslib_1.__importStar(require("../../config/ensureObjectPermissionsDeveloperEdition.json"));
const CONFIG_DEFAULTS = {
    ensureUserPermissions: ensureUserPermissionsDeveloperEdition.ensureUserPermissions,
    ensureObjectPermissions: ensureObjectPermissionsDeveloperEdition.ensureObjectPermissions,
    moveSourceFolders: [],
    applySourceFixes: ['source:retrieve:full', 'source:retrieve:all'],
    runHooks: false,
};
const resolvedConfigs = {};
exports.default = (path) => {
    if (path && resolvedConfigs[path]) {
        return resolvedConfigs[path];
    }
    const defaults = CONFIG_DEFAULTS;
    let configFromFile;
    try {
        configFromFile = fs.readJsonSync(path_1.join(path, '.sfdx-jayree.json'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            configFromFile = {};
        }
        else {
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
//# sourceMappingURL=config.js.map