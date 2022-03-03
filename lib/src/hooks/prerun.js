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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerun = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path = __importStar(require("path"));
const cli_ux_1 = require("cli-ux");
const kit_1 = require("@salesforce/kit");
const fs = __importStar(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const source_tracking_1 = require("@salesforce/source-tracking");
const core_1 = require("@salesforce/core");
const hookUtils_1 = require("../utils/hookUtils");
const souceUtils_1 = require("../utils/souceUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
const prerun = async function (options) {
    debug(`called 'jayree:prerun' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    if (options.Command.id === 'force:source:pull') {
        if (kit_1.env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_RESET_BEFORE_PULL', false)) {
            debug('force:source:pull detected');
            let storedServerMaxRevisionCounter;
            let storedServerMaxRevisionCounterPath;
            const projectPath = await (0, souceUtils_1.getProjectPath)();
            const project = core_1.SfdxProject.getInstance(projectPath);
            const userName = (await (0, souceUtils_1.getConnectionFromArgv)()).username;
            const org = await core_1.Org.create({ aliasOrUsername: userName });
            try {
                storedServerMaxRevisionCounterPath = path.join(projectPath, '.sfdx', 'orgs', org.getOrgId(), 'jayreeStoredMaxRevision.json');
                const { serverMaxRevisionCounter } = await fs.readJSON(storedServerMaxRevisionCounterPath, { throws: false });
                storedServerMaxRevisionCounter = serverMaxRevisionCounter;
                // eslint-disable-next-line no-empty
            }
            catch { }
            if (storedServerMaxRevisionCounter >= 0) {
                try {
                    const sourceTracking = await source_tracking_1.SourceTracking.create({ project, org });
                    await Promise.all([
                        sourceTracking.resetRemoteTracking(storedServerMaxRevisionCounter),
                        sourceTracking.resetLocalTracking(),
                    ]);
                    cli_ux_1.cli.log(`Reset local tracking files to revision ${storedServerMaxRevisionCounter}.`);
                    // eslint-disable-next-line no-empty
                }
                catch (error) { }
            }
            else {
                let localServerMaxRevisionCounter = 0;
                try {
                    const { serverMaxRevisionCounter } = await fs.readJSON(path.join(projectPath, '.sfdx', 'orgs', (await core_1.Org.create({ aliasOrUsername: userName })).getOrgId(), 'maxRevision.json'), { throws: false });
                    localServerMaxRevisionCounter = serverMaxRevisionCounter;
                    // eslint-disable-next-line no-empty
                }
                catch (error) { }
                const answer = await cli_ux_1.cli.confirm(chalk_1.default.dim(`WARNING: No stored revision found for scratch org with name: ${userName}.
Store current local revision: ${localServerMaxRevisionCounter}? (y/n)`));
                if (answer) {
                    await fs.ensureFile(storedServerMaxRevisionCounterPath);
                    await fs.writeJSON(storedServerMaxRevisionCounterPath, {
                        serverMaxRevisionCounter: localServerMaxRevisionCounter,
                    });
                }
            }
        }
    }
};
exports.prerun = prerun;
//# sourceMappingURL=prerun.js.map