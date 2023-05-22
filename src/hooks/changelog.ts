/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hook } from '@oclif/core';
import printChangeLog from '@jayree/changelog';
import Debug from 'debug';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

// eslint-disable-next-line @typescript-eslint/require-await
export const changelog: Hook<'update'> = async function () {
  const debug = Debug([this.config.bin, 'sfdx-jayree', 'hooks', 'update'].join(':'));

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.once('beforeExit', async () => {
    const changes = await printChangeLog(this.config.cacheDir, join(__dirname, '..', '..'), debug);
    if (changes) this.log(changes);
  });
};
