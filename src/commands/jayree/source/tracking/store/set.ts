/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import chalk from 'chalk';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingset');

export default class ScratchOrgRevisionInfo extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:source:tracking:store:set
$ sfdx jayree:source:tracking:store:set -u me@my.org
$ sfdx jayree:source:tracking:store:set -u MyTestOrg1 -r 101`,
  ];

  protected static flagsConfig = {
    revision: flags.integer({
      char: 'r',
      description: messages.getMessage('revision'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();

    const {
      records: [{ maxCounter, maxNum }],
    } = await conn.tooling.query('SELECT MAX(RevisionCounter) maxCounter,MAX(RevisionNum) maxNum from SourceMember');

    let maxRev = maxCounter >= maxNum ? maxCounter : maxNum;

    if (!maxRev) {
      maxRev = 0;
    }

    const storedmaxrevpath = path.join(
      this.project.getPath(),
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      'storedMaxRevision.json'
    );

    const newMaxRev = this.flags.revision >= 0 ? this.flags.revision : maxRev;

    await fs.ensureFile(storedmaxrevpath);
    await fs.writeJSON(storedmaxrevpath, { serverMaxRevisionCounter: newMaxRev });

    this.ux.styledHeader(chalk.blue('Set stored SourceMember revision counter number'));
    this.ux.table([{ username: this.org.getUsername(), serverMaxRevisionCounter: newMaxRev.toString() }], {
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
    });

    return {
      revision: newMaxRev,
      username: this.org.getUsername(),
    };
  }
}
