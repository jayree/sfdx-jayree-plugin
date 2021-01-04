/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { Command, Hook, IConfig } from '@oclif/config';
import { shrinkPermissionSets, updateProfiles } from '../utils/souceUtils';
import { runHooks } from '../utils/hookUtils';

type HookFunction = (this: Hook.Context, options: HookOptions) => any;

type HookOptions = {
  Command: Command.Class;
  argv: string[];
  commandId: string;
  result?: PostRetrieveResult;
  config: IConfig;
};

type PostRetrieveResult = {
  [fullName: string]: {
    mdapiFilePath: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');

export const postretrieve: HookFunction = async function (options) {
  debug(`called 'jayree:postretrieve' by: ${options.Command.id}`);
  if (!runHooks) {
    debug('hooks disabled');
    return;
  }
  const mdapiFilePaths = Object.values(options.result)
    .map((el) => el.mdapiFilePath)
    .flat();

  const profiles = mdapiFilePaths.filter((el) =>
    el.split(path.sep).join(path.posix.sep).includes('unpackaged/profiles/')
  );
  if (profiles.length > 0) {
    const retrievePackageDir = path.join(path.dirname(profiles[0]), '..');
    debug({ retrievePackageDir });
    await updateProfiles(profiles, retrievePackageDir, 'force:source:pull' === options.Command.id);
  }

  const permissionsets = mdapiFilePaths.filter((el) =>
    el.split(path.sep).join(path.posix.sep).includes('unpackaged/permissionsets/')
  );
  if (permissionsets.length > 0) {
    await shrinkPermissionSets(permissionsets);
  }
};
