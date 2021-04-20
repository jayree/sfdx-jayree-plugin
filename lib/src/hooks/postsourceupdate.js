"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsourceupdate = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = tslib_1.__importStar(require("path"));
const cli_ux_1 = require("cli-ux");
const kit_1 = require("@salesforce/kit");
const core_1 = require("@salesforce/core");
const souceUtils_1 = require("../utils/souceUtils");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
const isContentTypeJSON = kit_1.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
const postsourceupdate = async function (options) {
    debug(`called 'jayree:postsourceupdate' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    const sourceElements = Object.values(options.result)
        .map((el) => el.workspaceElements)
        .flat();
    debug({ sourceElements });
    const movedSourceFiles = await souceUtils_1.moveSourceFilesByFolder();
    debug({ movedSourceFiles });
    movedSourceFiles.forEach((element) => {
        const index = sourceElements.findIndex((ws) => ws.filePath === element.from);
        sourceElements[index].filePath = element.to;
    });
    const updatedfiles = await souceUtils_1.applySourceFixes(sourceElements.map((el) => el.filePath));
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
    sourceElements.forEach((element) => {
        if (!toRemove.includes(element.filePath)) {
            inboundFiles.push({
                state: toReadableState(element.state),
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
            void souceUtils_1.logMoves(movedSourceFiles);
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
exports.postsourceupdate = postsourceupdate;
function toReadableState(state) {
    switch (state) {
        case 'u':
            return 'Unchanged';
        case 'c':
            return 'Changed';
        case 'd':
            return 'Deleted';
        case 'n':
            return 'Add';
        case 'p':
            return 'Duplicate';
        default:
            return 'Unknown';
    }
}
//# sourceMappingURL=postsourceupdate.js.map