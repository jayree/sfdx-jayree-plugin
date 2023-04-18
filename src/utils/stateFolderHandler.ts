/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import fs from 'fs-extra';
import Debug from 'debug';
import ignore from 'ignore';

const debug = Debug('jayree:state:folder');

export async function getCurrentStateFolderFilePath(
  projectPath: string,
  file: string,
  migrate: boolean
): Promise<string> {
  const sfdxPath = path.join(projectPath, '.sfdx', file);
  const sfPath = path.join(projectPath, '.sf', file);

  if (!(await fs.pathExists(sfPath))) {
    if (await fs.pathExists(path.join(projectPath, '.gitignore'))) {
      const gitIgnore = ignore().add(Buffer.from(await fs.readFile(path.join(projectPath, '.gitignore'))).toString());
      if (!gitIgnore.ignores(path.join('.sf', file))) {
        if (gitIgnore.ignores(path.join('.sfdx', file))) {
          debug('use sfdx state folder');
          return sfdxPath;
        }
      }
    }

    if (await fs.pathExists(sfdxPath)) {
      if (migrate) {
        debug(`migrate '${file}' to '.sf' state folder`);
        await fs.copy(sfdxPath, sfPath);
      } else {
        debug('use sfdx state folder');
        return sfdxPath;
      }
    }
  }

  debug('use sf state folder');
  return sfPath;
}
