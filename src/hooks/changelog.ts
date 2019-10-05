import { Hook } from '@oclif/config';
import { accessSync, readFileSync, writeFileSync } from 'fs';
import marked = require('marked');
import terminalRenderer = require('marked-terminal');
import { dirname, join } from 'path';

// tslint:disable-next-line: no-any
export const changelog: Hook<any> = async () => {
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

  const latestversionfile = join(moduleRootPath, '.latestversion.json');
  const changelogfile = readFileSync(join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
  const packagejson = require(join(moduleRootPath, 'package.json'));
  let changelogtext;

  try {
    const latestversion = require(latestversionfile);
    changelogtext = changelogfile.substring(0, changelogfile.indexOf(`[${latestversion.version}]`));
  } catch (err) {
    changelogtext = changelogfile.substring(0, changelogfile.indexOf('# [', 2));
  } finally {
    changelogtext = changelogtext.substring(0, changelogtext.lastIndexOf('\n'));
    if (changelogtext.length > 0) {
      console.log(marked('# CHANGELOG (sfdx-jayree) - ' + moduleRootPath));
      console.log(marked(changelogtext));
    }
    writeFileSync(latestversionfile, JSON.stringify({ version: packagejson.version }), 'utf8');
  }
};
