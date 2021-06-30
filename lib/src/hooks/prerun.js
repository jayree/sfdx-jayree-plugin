"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerun = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path = tslib_1.__importStar(require("path"));
const cli_ux_1 = require("cli-ux");
const kit_1 = require("@salesforce/kit");
const fs = tslib_1.__importStar(require("fs-extra"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
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
            const projectPath = await souceUtils_1.getProjectPath();
            const userName = (await souceUtils_1.getConnectionFromArgv()).username;
            try {
                storedServerMaxRevisionCounterPath = path.join(projectPath, '.sfdx-jayree', 'orgs', userName, 'storedMaxRevision.json');
                const { serverMaxRevisionCounter } = await fs.readJSON(storedServerMaxRevisionCounterPath, { throws: false });
                storedServerMaxRevisionCounter = serverMaxRevisionCounter;
                // eslint-disable-next-line no-empty
            }
            catch { }
            if (storedServerMaxRevisionCounter >= 0) {
                try {
                    cli_ux_1.cli.log(`Reset local tracking files to revision ${storedServerMaxRevisionCounter}.`);
                    await execa_1.default('sfdx', [
                        'force:source:tracking:reset',
                        '--noprompt',
                        '--revision',
                        storedServerMaxRevisionCounter,
                    ]);
                    // eslint-disable-next-line no-empty
                }
                catch (error) { }
            }
            else {
                let localServerMaxRevisionCounter = 0;
                try {
                    const { serverMaxRevisionCounter } = await fs.readJSON(path.join(projectPath, '.sfdx', 'orgs', userName, 'maxRevision.json'), { throws: false });
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