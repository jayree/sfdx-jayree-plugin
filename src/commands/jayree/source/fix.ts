/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import chalk from 'chalk';
import { SourceRetrieveBase } from '../../../sourceRetrieveBase';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');

export default class FixMetadata extends SourceRetrieveBase {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ]; */

  protected static flagsConfig = {
    tag: flags.array({
      char: 't',
      description: messages.getMessage('tag'),
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
    const projectpath = this.project.getPath();
    let updatedfiles = [];

    try {
      const configfile = '.sfdx-jayree.json';
      let config;
      try {
        config = require(path.join(projectpath, configfile));
      } catch (error) {
        // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
      }

      updatedfiles = await this.applyfixes(config, this.flags.tag, projectpath);
      // eslint-disable-next-line no-empty
    } finally {
    }

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
      fixedFiles: Object.values(updatedfiles)
        .filter((value) => value.length > 0)
        .reduce((acc, val) => acc.concat(val), []),
      details: updatedfiles,
    };
  }
}
