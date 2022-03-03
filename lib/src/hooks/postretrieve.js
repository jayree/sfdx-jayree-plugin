"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postretrieve = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = __importStar(require("path"));
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
    if (result.length === 0) {
        return;
    }
    const profiles = result.filter((el) => el.type === 'Profile');
    if (profiles.length > 0) {
        const customObjects = result.filter((el) => el.type === 'CustomObject');
        await (0, souceUtils_1.updateProfiles)(profiles, customObjects, 'force:source:pull' === options.Command.id);
    }
    const permissionsets = result.filter((el) => ['PermissionSet', 'MutingPermissionSet'].includes(el.type));
    if (permissionsets.length > 0) {
        await (0, souceUtils_1.shrinkPermissionSets)(permissionsets.map((permset) => permset.filePath).filter(Boolean));
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.once('beforeExit', async () => {
        debug('beforeExit');
        const updatedfiles = await (0, souceUtils_1.applySourceFixes)(result.map((el) => el.filePath).filter(Boolean));
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
        if (isOutputEnabled) {
            void (0, souceUtils_1.logFixes)(updatedfiles);
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