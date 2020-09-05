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
import AdmZip from 'adm-zip';
import chalk from 'chalk';
import * as shell from 'shelljs';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';

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
        return JSON.parse(raw).result;
      } catch (error) {
        return JSON.parse(raw.stderr);
      }
    };

    const projectpath = this.project.getPath();
    let inboundFiles = [];
    let updatedfiles = [];

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
        shell.exec(
          `sfdx force:mdapi:retrieve --retrievetargetdir=${orgretrievepath} --unpackaged=${packageXMLFile} --targetusername=${this.org.getUsername()} --json`,
          { fatal: false, silent: true, env: { ...process.env, FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 } }
        )
      );

      if (out.success) {
        const zip = new AdmZip(out.zipFilePath);
        zip.extractAllTo(orgretrievepath);

        out = json(
          shell.exec(
            `sfdx force:mdapi:convert --outputdir=${path.join(orgretrievepath, 'src')} --rootdir=${path.join(
              orgretrievepath,
              'unpackaged'
            )} --json`,
            {
              fatal: false,
              silent: true,
              env: { ...process.env, FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 },
            }
          )
        );
        if (!out.length) {
          throw out;
        } else {
          out
            .map((p) => {
              return {
                fullName: p.fullName,
                type: p.type,
                filePath: path
                  .relative(orgretrievepath, p.filePath)
                  .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                state: 'undefined',
              };
            })
            .forEach((element) => {
              inboundFiles.push(element);
            });
        }

        shell.mv(path.join(orgretrievepath, 'src'), path.join(orgretrievepath, 'force-app'));
        await this.profileElementInjection(orgretrievepath);

        if (!this.flags.skipfix) {
          updatedfiles = await this.applyfixes(
            config,
            ['source:retrieve:full', 'source:retrieve:all'],
            orgretrievepath
          );
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
        throw out;
      }
    } finally {
      if (!this.flags.keepcache) {
        await core.fs.remove(orgretrievepath);
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
    }

    return {
      inboundFiles,
      fixedFiles: Object.values(updatedfiles)
        .filter((value) => value.length > 0)
        .reduce((acc, val) => acc.concat(val), []),
      details: updatedfiles,
    };
  }
}
