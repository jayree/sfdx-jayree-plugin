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
const cli_ux_1 = require("cli-ux");
const kit_1 = require("@salesforce/kit");
const core_1 = require("@salesforce/core");
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const souceUtils_1 = require("../utils/souceUtils");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
const isContentTypeJSON = kit_1.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
const postretrieve = async function (options) {
    debug(`called 'jayree:postretrieve' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    if (!isFileResponseArray(options.result)) {
        debug('options.result is not FileResponseArray');
        return;
    }
    const result = options.result.filter((el) => el.state !== source_deploy_retrieve_1.ComponentStatus.Failed);
    debug({ result });
    const profiles = result.filter((el) => el.type === 'Profile');
    if (profiles.length > 0) {
        const customObjects = result.filter((el) => el.type === 'CustomObject');
        await souceUtils_1.updateProfiles(profiles, customObjects, 'force:source:pull' === options.Command.id);
    }
    const permissionsets = result.filter((el) => ['PermissionSet', 'MutingPermissionSet'].includes(el.type));
    if (permissionsets.length > 0) {
        await souceUtils_1.shrinkPermissionSets(permissionsets.map((permset) => permset.filePath).filter(Boolean));
    }
    const updatedfiles = await souceUtils_1.applySourceFixes(result.map((el) => el.filePath).filter(Boolean));
    debug({ updatedfiles });
    const toRemove = Object.values(updatedfiles)
        .flat()
        .filter((value) => value.operation === 'deleteFile')
        .map((value) => value.filePath);
    debug({ toRemove });
    const toUpdate = {};
    Object.values(updatedfiles)
        .flat()
        .filter((value) => value.operation === 'moveFile')
        .forEach((value) => {
        toUpdate[value.filePath] = value.message;
    });
    debug({ toUpdate });
    const projectPath = await core_1.SfdxProject.resolveProjectPath();
    const inboundFiles = [];
    result.forEach((element) => {
        if (!toRemove.includes(element.filePath)) {
            inboundFiles.push({
                state: element.state,
                fullName: element.fullName,
                type: element.type,
                filePath: path.relative(projectPath, toUpdate[element.filePath] ? toUpdate[element.filePath] : element.filePath),
            });
        }
    });
    debug({ inboundFiles });
    process.once('beforeExit', () => {
        debug('beforeExit');
        if (isOutputEnabled) {
            void souceUtils_1.logFixes(updatedfiles);
        }
        else {
            if (kit_1.env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_JSON_OUTPUT', false)) {
                cli_ux_1.cli.log(',');
                cli_ux_1.cli.styledJSON({
                    result: {
                        [options.Command.id === 'force:source:pull' ? 'pulledSource' : 'inboundFiles']: inboundFiles,
                        fixedFiles: Object.values(updatedfiles)
                            .filter((value) => value.length > 0)
                            .reduce((acc, val) => acc.concat(val), []),
                    },
                });
            }
        }
        void this.config.runHook('prettierFormat', {
            ...options,
            result: inboundFiles.map((el) => el.filePath),
        });
    });
};
exports.postretrieve = postretrieve;
function isFileResponseArray(array) {
    return (Array.isArray(array) && array.some((element) => element.state !== undefined));
}
//# sourceMappingURL=postretrieve.js.map