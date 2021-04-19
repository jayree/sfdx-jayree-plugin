/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import * as fs from 'fs-extra';
import { Hook } from '@oclif/config';
import { ensureDirSync } from 'fs-extra';
import marked from 'marked';
import terminalRenderer from 'marked-terminal';

// eslint-disable-next-line @typescript-eslint/require-await
export const changelog: Hook<any> = async function () {
  process.once('exit', () => {
    marked.setOptions({ renderer: new terminalRenderer() });

    const cacheDir = join(this.config.cacheDir, 'sfdx-jayree');
    ensureDirSync(cacheDir);
    const versionFile = join(cacheDir, 'version');

    try {
      const moduleRootPath = join(__dirname, '..', '..', '..');
      const changelogFile = fs.readFileSync(join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
      const packageJson = fs.readJSONSync(join(moduleRootPath, 'package.json'));
      let changelogText;
      try {
        const latestVersion = fs.readJSONSync(versionFile);
        changelogText = changelogFile.substring(0, changelogFile.indexOf(`[${latestVersion.version}]`));
        if (changelogText.length === 0) {
          throw new Error('version not found');
        }
      } catch (err) {
        changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
      } finally {
        changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
        if (changelogText.length > 0) {
          // eslint-disable-next-line no-console
          console.log(marked('# CHANGELOG (sfdx-jayree)'));
          // eslint-disable-next-line no-console
          console.log(marked(changelogText));
        }
        fs.writeJsonSync(versionFile, { version: packageJson.version });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('CHANGELOG.md not found');
    }
  });
};
