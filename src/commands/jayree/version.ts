/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { accessSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';

export default class Version extends SfdxCommand {
  public static hidden = true;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    const root = () => {
      let currentPath = __dirname;
      let rootpath;
      while (!rootpath) {
        try {
          accessSync(join(currentPath, 'package.json'));
          rootpath = currentPath;
        } catch {
          currentPath = dirname(currentPath);
        }
      }
      return rootpath;
    };

    const packageJsonData = JSON.parse(readFileSync(join(root(), 'package.json'), 'utf-8'));
    this.ux.log(packageJsonData.version);
    return {
      version: packageJsonData.version,
    };
  }
}
