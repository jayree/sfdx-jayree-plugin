/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getCurrentStateFolderFilePath } from '../../../../../utils/stateFolderHandler.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingset');

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

    const storedmaxrevpath = await getCurrentStateFolderFilePath(
      this.project.getPath(),
      join('orgs', this.org.getOrgId(), 'jayreeStoredMaxRevision.json'),
      true
    );

    const newMaxRev = this.flags.revision >= 0 ? this.flags.revision : maxRev;

    await fs.ensureFile(storedmaxrevpath);
    await fs.writeJSON(storedmaxrevpath, { serverMaxRevisionCounter: newMaxRev });

    this.ux.styledHeader(chalk.blue('Set stored SourceMember revision counter number'));
    this.ux.table(
      [
        {
          username: this.org.getUsername(),
          orgid: this.org.getOrgId(),
          serverMaxRevisionCounter: newMaxRev.toString(),
        },
      ],
      {
        Username: {
          header: 'Username',
          get: (row: any) => row.username,
        },
        OrgId: {
          header: 'OrgId',
          get: (row: any) => row.orgid,
        },
        RevisionCounter: {
          header: 'RevisionCounter',
          get: (row: any) => row.serverMaxRevisionCounter,
        },
      }
    );

    return {
      revision: newMaxRev,
      username: this.org.getUsername(),
    };
  }
}
