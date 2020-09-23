/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, Hook, IConfig } from '@oclif/config';
import { env } from '@salesforce/kit';
import { moveSourceFilesByFolder, applySourceFixes, logFixes, logMoves } from '../utils/souceUtils';
import { runHooks } from '../utils/hookUtils';

type HookFunction = (this: Hook.Context, options: HookOptions) => any;

type HookOptions = {
  Command: Command.Class;
  argv: string[];
  commandId: string;
  result?: PostSourceUpdateResult;
  config: IConfig;
};

type PostSourceUpdateResult = {
  [aggregateName: string]: {
    workspaceElements: Array<{
      fullName: string;
      metadataName: string;
      filePath: string;
      state: string;
      deleteSupported: boolean;
    }>;
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');

const isContentTypeJSON = env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);

export const postsourceupdate: HookFunction = async function (options) {
  debug(`called 'jayree:postsourceupdate' by: ${options.Command.id}`);
  if (!runHooks) {
    debug('hooks disabled');
    return;
  }
  let sourcePaths = Object.values(options.result)
    .map((el) => el.workspaceElements)
    .flat()
    .map((el) => el.filePath);

  debug({ sourcePaths });

  const movedSourceFiles = await moveSourceFilesByFolder();
  movedSourceFiles.forEach((element) => {
    const index = sourcePaths.indexOf(element.from);
    sourcePaths[index] = element.to;
  });
  debug({ movedSourceFiles });

  const updatedfiles = await applySourceFixes(sourcePaths);
  debug({ updatedfiles });

  const toRemove = Object.values(updatedfiles)
    .flat()
    .filter((value) => value.operation === 'deleteFile')
    .map((value) => value.filePath);
  debug({ toRemove });

  sourcePaths = sourcePaths.filter((el) => !toRemove.includes(el));

  process.once('beforeExit', () => {
    debug('beforeExit');
    if (isOutputEnabled) {
      void logMoves(movedSourceFiles);
      void logFixes(updatedfiles);
    }
    void this.config.runHook('prettierFormat', { ...options, result: sourcePaths });
  });
};
