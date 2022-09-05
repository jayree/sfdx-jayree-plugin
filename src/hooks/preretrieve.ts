/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Hook, Config } from '@oclif/core';
import { env } from '@salesforce/kit';
import Debug from 'debug';
import { runHooks } from '../utils/hookUtils.js';

type HookFunction = (this: Hook.Context, options: HookOptions) => any;

type HookOptions = {
  Command;
  argv: string[];
  commandId: string;
  result?: PreRetrieveResult;
  config: Config;
};

type PreRetrieveResult = {
  packageXmlPath: string;
};

const debug = Debug('jayree:hooks');

// eslint-disable-next-line @typescript-eslint/require-await
export const preretrieve: HookFunction = async function (options) {
  debug(`called 'jayree:preretrieve' by: ${options.Command.id}`);
  if (!runHooks) {
    debug('hooks disabled');
    return;
  }
  env.setBoolean('SFDX_DISABLE_PRETTIER', true);
  debug('set: SFDX_DISABLE_PRETTIER=true');
};
