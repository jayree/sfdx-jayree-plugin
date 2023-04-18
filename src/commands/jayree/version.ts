/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { accessSync, readFileSync } from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

// eslint-disable-next-line sf-plugin/command-example, sf-plugin/command-summary
export default class Version extends SfCommand<AnyJson> {
  public static readonly hidden = true;

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
    this.log(packageJsonData.version);
    return {
      version: packageJsonData.version,
    };
  }
}
