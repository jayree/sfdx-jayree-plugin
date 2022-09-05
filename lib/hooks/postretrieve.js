/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { CliUx } from '@oclif/core';
import { env } from '@salesforce/kit';
import { SfProject } from '@salesforce/core';
import { ComponentStatus } from '@salesforce/source-deploy-retrieve';
import Debug from 'debug';
import { shrinkPermissionSets, updateProfiles, applySourceFixes, logFixes } from '../utils/souceUtils.js';
import { runHooks } from '../utils/hookUtils.js';
const debug = Debug('jayree:hooks');
const isContentTypeJSON = env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
export const postretrieve = async function (options) {
    debug(`called 'jayree:postretrieve' by: ${options.Command.id}`);
    if (!runHooks) {
        debug('hooks disabled');
        return;
    }
    if (!isFileResponseArray(options.result)) {
        debug('options.result is not FileResponseArray');
        return;
    }
    const result = options.result.filter((el) => el.state !== ComponentStatus.Failed);
    debug({ result });
    if (result.length === 0) {
        return;
    }
    const profiles = result.filter((el) => el.type === 'Profile');
    if (profiles.length > 0) {
        const customObjects = result.filter((el) => el.type === 'CustomObject');
        await updateProfiles(profiles, customObjects, 'force:source:pull' === options.Command.id);
    }
    const permissionsets = result.filter((el) => ['PermissionSet', 'MutingPermissionSet'].includes(el.type));
    if (permissionsets.length > 0) {
        await shrinkPermissionSets(permissionsets.map((permset) => permset.filePath).filter(Boolean));
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.once('beforeExit', async () => {
        debug('beforeExit');
        const updatedfiles = await applySourceFixes(result.map((el) => el.filePath).filter(Boolean));
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
        const projectPath = await SfProject.resolveProjectPath();
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
        if (isOutputEnabled) {
            void logFixes(updatedfiles);
        }
        else if (env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_JSON_OUTPUT', false)) {
            CliUx.ux.log(',');
            CliUx.ux.styledJSON({
                result: {
                    [options.Command.id === 'force:source:pull' ? 'pulledSource' : 'inboundFiles']: inboundFiles,
                    fixedFiles: Object.values(updatedfiles)
                        .filter((value) => value.length > 0)
                        .reduce((acc, val) => acc.concat(val), []),
                },
            });
        }
        void this.config.runHook('prettierFormat', {
            ...options,
            result: inboundFiles.map((el) => el.filePath),
        });
    });
};
function isFileResponseArray(array) {
    return (Array.isArray(array) && array.some((element) => element.state !== undefined));
}
//# sourceMappingURL=postretrieve.js.map