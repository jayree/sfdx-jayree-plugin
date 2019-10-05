import { Hook } from '@oclif/config';
import { accessSync, readFileSync, writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import marked = require('marked');
import terminalRenderer = require('marked-terminal');
import { dirname, join } from 'path';

// tslint:disable-next-line: no-any
export const changelog: Hook<any> = async function() {
  let currentPath = __dirname;

  let moduleRootPath;
  while (!moduleRootPath) {
    try {
      const path = join(currentPath, 'package.json');
      accessSync(path);
      moduleRootPath = currentPath;
    } catch (err) {
      currentPath = dirname(currentPath);
      if (currentPath === '/') {
        throw new Error(`package.json root not found`);
      }
    }
  }

  marked.setOptions({ renderer: new terminalRenderer() });

  const cachedir = join(this.config.cacheDir, 'sfdx-jayree');
  ensureDirSync(cachedir);
  const versionfile = join(cachedir, 'version');

  const changelogfile = readFileSync(join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
  let changelogtext;

  const packagejson = JSON.parse(readFileSync(join(moduleRootPath, 'package.json'), 'utf8'));

  try {
    const latestversion = JSON.parse(readFileSync(versionfile, 'utf8'));
    changelogtext = changelogfile.substring(0, changelogfile.indexOf(`[${latestversion.version}]`));
    if (changelogtext.length === 0) {
      throw new Error(`version not found`);
    }
  } catch (err) {
    changelogtext = changelogfile.substring(0, changelogfile.indexOf('# [', 2));
  } finally {
    changelogtext = changelogtext.substring(0, changelogtext.lastIndexOf('\n'));
    if (changelogtext.length > 0) {
      console.log(marked('# CHANGELOG (sfdx-jayree)'));
      console.log(marked(changelogtext));
    }
    writeFileSync(versionfile, JSON.stringify({ version: packagejson.version }), 'utf8');
  }
};
