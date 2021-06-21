/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, Hook, IConfig } from '@oclif/config';
import { env } from '@salesforce/kit';
import { runHooks } from '../utils/hookUtils';

type HookFunction = (this: Hook.Context, options: HookOptions) => any;

type HookOptions = {
  Command: Command.Class;
  argv: string[];
  commandId: string;
  result?: PreRetrieveResult;
  config: IConfig;
};

type PreRetrieveResult = {
  packageXmlPath: string;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');

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
