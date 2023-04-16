/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import path from 'path';
import { ux } from '@oclif/core';
import { env } from '@salesforce/kit';
import fs from 'fs-extra';
import chalk from 'chalk';
import { SourceTracking } from '@salesforce/source-tracking';
import { SfProject, Org } from '@salesforce/core';
import Debug from 'debug';
import { getConnectionFromArgv, getProjectPath } from '../utils/souceUtils.js';
import { getCurrentStateFolderFilePath } from '../utils/stateFolderHandler.js';
const debug = Debug('jayree:hooks');
export const prerun = async function (options) {
    debug(`called 'jayree:prerun' by: ${options.Command.id}`);
    if (options.Command.id === 'force:source:pull') {
        if (env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_RESET_BEFORE_PULL', false)) {
            debug('force:source:pull detected');
            let storedServerMaxRevisionCounter;
            let storedServerMaxRevisionCounterPath;
            const projectPath = await getProjectPath();
            const project = SfProject.getInstance(projectPath);
            const userName = (await getConnectionFromArgv()).username;
            const org = await Org.create({ aliasOrUsername: userName });
            try {
                storedServerMaxRevisionCounterPath = await getCurrentStateFolderFilePath(projectPath, path.join('orgs', org.getOrgId(), 'jayreeStoredMaxRevision.json'), true);
                const { serverMaxRevisionCounter } = await fs.readJSON(storedServerMaxRevisionCounterPath, { throws: false });
                storedServerMaxRevisionCounter = serverMaxRevisionCounter;
                // eslint-disable-next-line no-empty
            }
            catch { }
            if (storedServerMaxRevisionCounter >= 0) {
                try {
                    const sourceTracking = await SourceTracking.create({ project, org });
                    await Promise.all([
                        sourceTracking.resetRemoteTracking(storedServerMaxRevisionCounter),
                        sourceTracking.resetLocalTracking(),
                    ]);
                    ux.log(`Reset local tracking files to revision ${storedServerMaxRevisionCounter}.`);
                    // eslint-disable-next-line no-empty
                }
                catch (error) { }
            }
            else {
                let localServerMaxRevisionCounter = 0;
                try {
                    const { serverMaxRevisionCounter } = await fs.readJSON(await getCurrentStateFolderFilePath(projectPath, path.join('orgs', (await Org.create({ aliasOrUsername: userName })).getOrgId(), 'maxRevision.json'), false), { throws: false });
                    localServerMaxRevisionCounter = serverMaxRevisionCounter;
                    // eslint-disable-next-line no-empty
                }
                catch (error) { }
                const answer = await ux.confirm(chalk.dim(`WARNING: No stored revision found for scratch org with name: ${userName}.
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
//# sourceMappingURL=prerun.js.map