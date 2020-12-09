/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import chalk from 'chalk';
import execa = require('execa');
import * as xml2js from 'xml2js';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';
import { applyFixes, aggregatedFixResults } from '../../../../utils/souceUtils';
import config from '../../../../utils/config';
import { builder } from '../../../../utils/xml';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefull');

export default class RetrieveProfiles extends SourceRetrieveBase {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ]; */

  protected static flagsConfig = {
    keepcache: flags.boolean({
      char: 'c',
      hidden: true,
      description: messages.getMessage('keepcache'),
    }),
    metadata: flags.array({
      char: 'm',
      description: messages.getMessage('metadata'),
      options: ['Profile', 'PermissionSet', 'CustomLabels'],
      default: ['Profile', 'PermissionSet'],
    }),
    verbose: flags.builtin({
      description: messages.getMessage('log'),
      longDescription: messages.getMessage('log'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();

    const projectpath = this.project.getPath();
    let inboundFiles = [];
    let updatedfiles: aggregatedFixResults = {};

    const orgretrievepath = path.join(
      projectpath,
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      `sdx_retrieveProfiles_${Date.now()}`
    );

    try {
      this.ux.log(`Using ${orgretrievepath}`);

      await core.fs.mkdirp(orgretrievepath, core.fs.DEFAULT_USER_DIR_MODE);

      let packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-profiles.xml');

      const pjson = await xml2js.parseStringPromise(fs.readFileSync(packagexml, 'utf8'));
      pjson.Package.types[
        pjson.Package.types.findIndex((x) => x.name.toString() === 'CustomObject')
      ].members = pjson.Package.types[
        pjson.Package.types.findIndex((x) => x.name.toString() === 'CustomObject')
      ].members.concat(config(this.project.getPath()).ensureObjectPermissions);

      packagexml = path.join(orgretrievepath, 'pinject.xml');
      await fs.writeFile(packagexml, builder.buildObject(pjson));

      if (!this.flags.metadata.includes('Profile') && !this.flags.metadata.includes('PermissionSet')) {
        packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-labels.xml');
      }

      await execa('sfdx', ['force:project:create', '--projectname', '.', '--json'], {
        cwd: orgretrievepath,
        env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' },
      });

      const out = JSON.parse(
        (
          await execa(
            'sfdx',
            ['force:source:retrieve', '--manifest', packagexml, '--targetusername', this.org.getUsername(), '--json'],
            { cwd: orgretrievepath, env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' } }
          )
        ).stdout
      );

      if (out?.result?.inboundFiles?.length > 0) {
        if (this.flags.metadata.includes('Profile')) {
          inboundFiles.push(
            ...out.result.inboundFiles.filter((x) => x.filePath.includes('force-app/main/default/profiles'))
          );
        }

        if (this.flags.metadata.includes('PermissionSet')) {
          inboundFiles.push(
            ...out.result.inboundFiles.filter((x) => x.filePath.includes('force-app/main/default/permissionsets'))
          );
        }

        if (this.flags.metadata.includes('CustomLabels')) {
          inboundFiles.push(
            ...out.result.inboundFiles.filter((x) => x.filePath.includes('force-app/main/default/labels'))
          );
        }

        await this.profileElementInjection(orgretrievepath);
        await this.shrinkPermissionSets(orgretrievepath);

        updatedfiles = await applyFixes(['source:retrieve:full'], orgretrievepath);
        // eslint-disable-next-line no-console
        console.log({ updatedfiles: Object.values(updatedfiles), inboundFiles });

        inboundFiles = inboundFiles.filter((x) => fs.pathExistsSync(path.join(orgretrievepath, x.filePath)));

        // eslint-disable-next-line no-console
        console.log('hier');

        const forceTargetPath = path.join(projectpath, 'force-app/main/default/');
        await fs.ensureDir(forceTargetPath);
        if (this.flags.metadata.includes('Profile')) {
          await fs.copy(
            path.join(orgretrievepath, 'force-app/main/default/profiles'),
            path.join(forceTargetPath, 'profiles')
          );
        }

        if (this.flags.metadata.includes('PermissionSet')) {
          await fs.copy(
            path.join(orgretrievepath, 'force-app/main/default/permissionsets'),
            path.join(forceTargetPath, 'permissionsets')
          );
        }

        if (this.flags.metadata.includes('CustomLabels')) {
          await fs.copy(
            path.join(orgretrievepath, 'force-app/main/default/labels'),
            path.join(forceTargetPath, 'labels')
          );
        }
      } else {
        throw new Error(out.message);
      }
    } finally {
      if (!this.flags.keepcache) {
        await core.fs.remove(orgretrievepath);
      }
    }
    this.ux.styledHeader(chalk.blue('Retrieved Source'));
    this.ux.table(inboundFiles, {
      columns: [
        {
          key: 'fullName',
          label: 'FULL NAME',
        },
        {
          key: 'type',
          label: 'TYPE',
        },
        {
          key: 'filePath',
          label: 'PROJECT PATH',
        },
      ],
    });

    Object.keys(updatedfiles).forEach((workaround) => {
      if (updatedfiles[workaround].length > 0) {
        this.ux.styledHeader(chalk.blue(`Fixed Source: ${workaround}`));
        this.ux.table(updatedfiles[workaround], {
          columns: [
            {
              key: 'filePath',
              label: 'FILEPATH',
            },
            {
              key: 'operation',
              label: 'OPERATION',
            },
            {
              key: 'message',
              label: 'MESSAGE',
            },
          ],
        });
      }
    });

    return {
      inboundFiles,
      fixedFiles: Object.values(updatedfiles)
        .filter((value) => value.length > 0)
        .reduce((acc, val) => acc.concat(val), []),
      details: updatedfiles,
    };
  }
}
