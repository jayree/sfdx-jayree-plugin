/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import * as util from 'util';
import { SfdxCommand } from '@salesforce/command';
import chalk from 'chalk';
import createDebug from 'debug';
import * as fs from 'fs-extra';
import globby from 'globby';
import * as xml2js from 'xml2js';
import * as souceUtils from './utils/souceUtils';

const debug = createDebug('jayree:source');

const parseString = util.promisify(xml2js.parseString);

const builder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  xmlns: true,
  renderOpts: { pretty: true, indent: '    ', newline: '\n' },
});

export abstract class SourceRetrieveBase extends SfdxCommand {
  public log(msg, indent?) {
    let prefix = '> ';
    if (indent) {
      prefix = new Array(indent * 2 + 1).join(' ');
      msg = msg.replace(/\n/g, `\n${prefix}`);
    } else {
      msg = chalk.bold(msg);
    }
    msg = `${prefix}${msg}`;
    if (this.flags.verbose) {
      this.ux.log(chalk.dim.yellow(msg));
    } else {
      this.logger.info(msg);
    }
  }

  protected getScopedValue(config) {
    let value;
    if (typeof config === 'object') {
      if (typeof config[this.flags.scope] === 'string') {
        value = config[this.flags.scope];
      } else {
        value = config.default;
      }
    } else {
      value = config;
    }
    return value;
  }

  protected async profileElementInjection(root) {
    const profiles = await globby(join(root, 'force-app/main/default/profiles/*'));
    const adminProfilePath = join(root, 'force-app/main/default/profiles/Admin.profile-meta.xml');
    if (profiles.length > 0) {
      if (await fs.pathExists(adminProfilePath)) {
        const profileElementInjectionFromAdmin = {
          ensureObjectPermissions: (
            await parseString(fs.readFileSync(adminProfilePath, 'utf8'))
          ).Profile.objectPermissions.map((el) => el.object.toString()),
        };
        await souceUtils.profileElementInjection(profiles, profileElementInjectionFromAdmin);
      }
    }
  }

  protected async cleanuppackagexml(manifest, manifestignore, root) {
    debug(`apply '${join(root, manifestignore)}' to '${manifest}'`);

    const packageignore = await parseString(fs.readFileSync(join(root, manifestignore), 'utf8'));
    const newpackage = await parseString(fs.readFileSync(manifest, 'utf8'));

    const newPackageTypesMapped = [];
    newpackage.Package.types.forEach((value) => {
      newPackageTypesMapped[value.name] = value.members;
    });

    packageignore.Package.types.forEach((types) => {
      if (typeof newPackageTypesMapped[types.name] !== 'undefined') {
        if (types.members.includes('*') && types.members.length > 1) {
          const includedmembers = types.members.slice();
          includedmembers.splice(includedmembers.indexOf('*'), 1);
          debug('include only members ' + includedmembers.toString() + ' for type ' + types.name, 1);
          newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter((value) => {
            return types.members.includes(value);
          });
        }

        if (types.members.includes('*') && types.members.length === 1) {
          debug('exclude all members for type ' + types.name, 1);
          newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter(() => {
            return false;
          });
        }

        if (!types.members.includes('*')) {
          newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter((value) => {
            return !types.members.includes(value);
          });
        }
      }
    });

    const newPackageTypesUpdated = [];
    Object.keys(newPackageTypesMapped).forEach((key) => {
      if (newPackageTypesMapped[key].length > 0) {
        newPackageTypesUpdated.push({
          name: key,
          members: newPackageTypesMapped[key],
        });
      }
    });

    newpackage.Package.types = newPackageTypesUpdated;

    fs.writeFileSync(manifest, builder.buildObject(newpackage));
  }
}
