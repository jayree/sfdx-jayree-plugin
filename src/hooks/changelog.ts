/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Hook } from '@oclif/config';
import { ensureDirSync } from 'fs-extra';
import marked = require('marked');
import terminalRenderer = require('marked-terminal');

// eslint-disable-next-line @typescript-eslint/require-await
export const changelog: Hook<any> = async function () {
  marked.setOptions({ renderer: new terminalRenderer() });

  const cacheDir = join(this.config.cacheDir, 'sfdx-jayree');
  ensureDirSync(cacheDir);
  const versionFile = join(cacheDir, 'version');

  const moduleRootPath = join(__dirname, '/..', '/..', '/..');

  try {
    const changelogFile = readFileSync(join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
    const packageJson = JSON.parse(readFileSync(join(moduleRootPath, 'package.json'), 'utf8'));
    let changelogText;
    try {
      const latestVersion = JSON.parse(readFileSync(versionFile, 'utf8'));
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
      writeFileSync(versionFile, JSON.stringify({ version: packageJson.version }), 'utf8');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('CHANGELOG.md not found');
  }
};
