/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import * as path from 'path';
import { Hook } from '@oclif/config';
import { cli } from 'cli-ux';
import { env } from '@salesforce/kit';
import * as fs from 'fs-extra';
import execa = require('execa');
import chalk from 'chalk';
import { runHooks } from '../utils/hookUtils';
import { getConnectionFromArgv, getProjectPath } from '../utils/souceUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
export const prerun: Hook<'prerun'> = async function (options) {
  debug(`called 'jayree:prerun' by: ${options.Command.id}`);
  if (!runHooks) {
    debug('hooks disabled');
    return;
  }
  if (env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_RESET_BEFORE_PULL', false)) {
    if (options.Command.id === 'force:source:pull') {
      debug('force:source:pull detected');
      let storedServerMaxRevisionCounter;
      let storedServerMaxRevisionCounterPath;
      const projectPath = await getProjectPath();
      const userName = (await getConnectionFromArgv()).username;
      try {
        storedServerMaxRevisionCounterPath = path.join(
          projectPath,
          '.sfdx-jayree',
          'orgs',
          userName,
          'storedMaxRevision.json'
        );
        const { serverMaxRevisionCounter } = await fs.readJSON(storedServerMaxRevisionCounterPath, { throws: false });
        storedServerMaxRevisionCounter = serverMaxRevisionCounter;
        // eslint-disable-next-line no-empty
      } catch {}
      if (storedServerMaxRevisionCounter) {
        try {
          cli.log(`Reset local tracking files to revision ${storedServerMaxRevisionCounter}.`);
          await execa('sfdx', [
            'force:source:tracking:reset',
            '--noprompt',
            '--revision',
            storedServerMaxRevisionCounter,
          ]);
          // eslint-disable-next-line no-empty
        } catch (error) {}
      } else {
        let localServerMaxRevisionCounter = 0;
        try {
          const { serverMaxRevisionCounter } = await fs.readJSON(
            path.join(projectPath, '.sfdx', 'orgs', userName, 'maxRevision.json'),
            { throws: false }
          );
          localServerMaxRevisionCounter = serverMaxRevisionCounter;
          // eslint-disable-next-line no-empty
        } catch (error) {}
        const answer = await cli.confirm(
          chalk.dim(
            `WARNING: No stored revision found for scratch org with name: ${userName}.
Store current local revision: ${localServerMaxRevisionCounter}? (y/n)`
          )
        );
        if (answer) {
          await fs.ensureFile(storedServerMaxRevisionCounterPath);
          await fs.writeJSON(storedServerMaxRevisionCounterPath, {
            localServerMaxRevisionCounter,
          });
        }
      }
    }
  }
};
