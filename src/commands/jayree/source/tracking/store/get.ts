/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { core, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import chalk from 'chalk';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingget');

export default class ScratchOrgRevisionInfo extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:source:tracking:store:get
$ sfdx jayree:source:tracking:store:get -u me@my.org`,
  ];

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const { serverMaxRevisionCounter } = await fs.readJSON(
      path.join(this.project.getPath(), '.sfdx-jayree', 'orgs', this.org.getUsername(), 'storedMaxRevision.json'),
      { throws: false }
    );
    this.ux.styledHeader(chalk.blue('Get stored SourceMember revision counter number'));
    this.ux.table(
      [{ username: this.org.getUsername(), serverMaxRevisionCounter: serverMaxRevisionCounter.toString() }],
      {
        columns: [
          {
            key: 'Username',
            get: (row: any) => row.username,
          },
          {
            key: 'RevisionCounter',
            get: (row: any) => row.serverMaxRevisionCounter,
          },
        ],
      }
    );
    return {
      revision: serverMaxRevisionCounter,
      username: this.org.getUsername(),
    };
  }
}
