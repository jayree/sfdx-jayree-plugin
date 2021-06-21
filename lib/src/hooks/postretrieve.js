"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postretrieve = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = tslib_1.__importStar(require("path"));
const souceUtils_1 = require("../utils/souceUtils");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
const postretrieve = async function (options) {
    debug(`called 'jayree:postretrieve' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    const mdapiFilePaths = Object.values(options.result)
        .map((el) => el.mdapiFilePath)
        .flat();
    const profiles = mdapiFilePaths.filter((el) => el.split(path.sep).join(path.posix.sep).includes('unpackaged/profiles/'));
    if (profiles.length > 0) {
        const retrievePackageDir = path.join(path.dirname(profiles[0]), '..');
        debug({ retrievePackageDir });
        await souceUtils_1.updateProfiles(profiles, retrievePackageDir, 'force:source:pull' === options.Command.id);
    }
    const permissionsets = mdapiFilePaths.filter((el) => {
        const posixPath = el.split(path.sep).join(path.posix.sep);
        return posixPath.includes('unpackaged/permissionsets/') || posixPath.includes('unpackaged/mutingpermissionsets/');
    });
    if (permissionsets.length > 0) {
        await souceUtils_1.shrinkPermissionSets(permissionsets);
    }
};
exports.postretrieve = postretrieve;
//# sourceMappingURL=postretrieve.js.map