/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { Command, Hook, IConfig } from '@oclif/config';
import { cli } from 'cli-ux';
import { env } from '@salesforce/kit';
import { SfdxProject } from '@salesforce/core';
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
      type: string;
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
  const sourceElements = Object.values(options.result)
    .map((el) => el.workspaceElements)
    .flat();

  debug({ sourceElements });

  const movedSourceFiles = await moveSourceFilesByFolder();
  debug({ movedSourceFiles });

  movedSourceFiles.forEach((element) => {
    const index = sourceElements.findIndex((ws) => ws.filePath === element.from);
    sourceElements[index].filePath = element.to;
  });

  const updatedfiles = await applySourceFixes(sourceElements.map((el) => el.filePath));
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

  const projectPath = await SfdxProject.resolveProjectPath();
  const inboundFiles = [];

  sourceElements.forEach((element) => {
    if (!toRemove.includes(element.filePath)) {
      inboundFiles.push({
        state: toReadableState(element.state),
        fullName: element.fullName,
        type: element.type,
        filePath: path.relative(
          projectPath,
          toUpdate[element.filePath] ? toUpdate[element.filePath] : element.filePath
        ),
      });
    }
  });
  debug({ inboundFiles });

  process.once('beforeExit', () => {
    debug('beforeExit');
    if (isOutputEnabled) {
      void logMoves(movedSourceFiles);
      void logFixes(updatedfiles);
    } else {
      if (env.getBoolean('SFDX_ENABLE_JAYREE_HOOKS_JSON_OUTPUT', false)) {
        cli.log(',');
        cli.styledJSON({
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
      result: sourceElements.map((el) => el.filePath).filter((el) => !toRemove.includes(el)),
    });
  });
};

function toReadableState(state) {
  switch (state) {
    case 'u':
      return 'Unchanged';
    case 'c':
      return 'Changed';
    case 'd':
      return 'Deleted';
    case 'n':
      return 'Add';
    case 'p':
      return 'Duplicate';
    default:
      return 'Unknown';
  }
}
