/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import * as path from 'path';
import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
// import AdmZip from 'adm-zip';
import chalk from 'chalk';
import * as shell from 'shelljs';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';
import { applyFixes, aggregatedFixResults } from '../../../../utils/souceUtils';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrieveall');

export default class RetrieveMetadata extends SourceRetrieveBase {
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
    skipfix: flags.boolean({
      hidden: true,
      description: messages.getMessage('keepcache'),
    }),
    verbose: flags.builtin({
      description: messages.getMessage('log'),
      longDescription: messages.getMessage('log'),
    }),
    scope: flags.string({
      char: 's',
      description: messages.getMessage('scope'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();

    const json = (raw) => {
      try {
        const j = JSON.parse(raw);
        if (j.status === 0) {
          return j.result;
        } else {
          return j;
        }
      } catch (error) {
        return raw;
      }
    };

    const projectpath = this.project.getPath();
    let inboundFiles = [];
    let updatedfiles: aggregatedFixResults = {};

    const orgretrievepath = path.join(
      projectpath,
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      `sdx_retrieveMetadata_${Date.now()}`
    );

    try {
      const configfile = '.sfdx-jayree.json';
      let config;
      try {
        config = require(path.join(projectpath, configfile));
      } catch (error) {
        // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
      }

      await core.fs.mkdirp(orgretrievepath, core.fs.DEFAULT_USER_DIR_MODE);

      if (typeof config['source:retrieve:all'].manifestignore === 'object') {
        if (typeof config['source:retrieve:all'].manifestignore.default === 'undefined') {
          if (typeof this.flags.scope === 'undefined') {
            throw Error(`Missing required flag:
 -s, --scope SCOPE  config scope to use
See more help with --help`);
          } else {
            if (typeof config['source:retrieve:all'].manifestignore[this.flags.scope] === 'undefined') {
              throw Error(`Scope ${this.flags.scope} not found`);
            }
          }
        }
      }

      this.ux.log(`Using ${orgretrievepath}`);

      let packageXMLFile = path.join(orgretrievepath, 'package.xml');
      if (config) {
        if (config['source:retrieve:all']) {
          if (config['source:retrieve:all'].manifest) {
            packageXMLFile = path.join(projectpath, this.getScopedValue(config['source:retrieve:all'].manifest));
          }
        }
      }

      let out = shell.exec(
        `sfdx jayree:packagexml --excludemanaged --file=${packageXMLFile} --targetusername=${this.org.getUsername()} --json`,
        { fatal: false, silent: true, env: { ...process.env, FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 } }
      );
      if (config) {
        if (config['source:retrieve:all']) {
          if (config['source:retrieve:all'].manifestignore) {
            await this.cleanuppackagexml(
              packageXMLFile,
              this.getScopedValue(config['source:retrieve:all'].manifestignore),
              projectpath
            );
          }
        }
      }

      out = json(
        shell.exec('sfdx force:project:create --projectname=. --json', {
          cwd: orgretrievepath,
          fatal: false,
          silent: true,
          env: { ...process.env, FORCE_COLOR: 0, SFDX_DISABLE_JAYREE_HOOKS: true },
        })
      );

      out = json(
        shell.exec(
          `sfdx force:source:retrieve --manifest=${packageXMLFile} --targetusername=${this.org.getUsername()} --json`,
          {
            cwd: orgretrievepath,
            fatal: false,
            silent: true,
            env: { ...process.env, FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 },
          }
        )
      );

      if (out?.inboundFiles?.length > 0) {
        inboundFiles = out.inboundFiles;

        await this.profileElementInjection(orgretrievepath);
        await this.shrinkPermissionSets(orgretrievepath);

        if (!this.flags.skipfix) {
          updatedfiles = await applyFixes(['source:retrieve:full', 'source:retrieve:all'], orgretrievepath);
        }

        const cleanedfiles = shell
          .find(path.join(orgretrievepath, 'force-app'))
          .filter((file) => {
            return fs.lstatSync(file).isFile();
          })
          .map((file) => path.relative(orgretrievepath, file));

        inboundFiles = inboundFiles.filter((x) => {
          if (cleanedfiles.includes(x.filePath)) {
            return x;
          }
        });

        const forceapppath = path.join(projectpath, 'force-app');
        shell.cp('-R', path.join(orgretrievepath, 'force-app/main'), forceapppath);
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
