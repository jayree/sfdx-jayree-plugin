import { Hook } from '@oclif/config';
import { readFileSync, writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import marked = require('marked');
import terminalRenderer = require('marked-terminal');
import { join } from 'path';

// tslint:disable-next-line: no-any
export const changelog: Hook<any> = async function() {
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
        throw new Error(`version not found`);
      }
    } catch (err) {
      changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
    } finally {
      changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
      if (changelogText.length > 0) {
        console.log(marked('# CHANGELOG (sfdx-jayree)'));
        console.log(marked(changelogText));
      }
      writeFileSync(versionFile, JSON.stringify({ version: packageJson.version }), 'utf8');
    }
  } catch (error) {
    console.log('CHANGELOG.md not found');
  }
};
