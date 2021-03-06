/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import * as path from 'path';
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import chalk from 'chalk';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackinglist');

export default class SourceTrackingList extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:source:tracking:list
$ sfdx jayree:source:tracking:list -u me@my.org
$ sfdx jayree:source:tracking:list -u me@my.org -r 101`,
  ];

  protected static flagsConfig = {
    revision: flags.integer({
      char: 'r',
      description: messages.getMessage('startrevision'),
      default: 0,
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

    const maxRev = maxCounter >= maxNum ? maxCounter : maxNum;

    const maxrevpath = path.join(this.project.getPath(), '.sfdx', 'orgs', this.org.getUsername(), 'maxRevision.json');

    let maxrevfile;

    try {
      const json = await fs.readJSON(maxrevpath);
      if (Object.keys(json.sourceMembers).length > 0) {
        maxrevfile = Math.max(
          0,
          ...Object.keys(json.sourceMembers).map((key) => json.sourceMembers[key].lastRetrievedFromServer)
        );
        if (maxrevfile === 0) {
          maxrevfile = Math.min(
            ...Object.keys(json.sourceMembers).map((key) => json.sourceMembers[key].serverRevisionCounter)
          );
          if (maxrevfile !== 0) {
            maxrevfile = maxrevfile - 1;
          }
        }
      } else {
        // support resetting local source tracking with sourceMembers={}
        maxrevfile = json.serverMaxRevisionCounter;
      }
    } catch {
      maxrevfile = 0;
    }

    let storedServerMaxRevisionCounter;

    try {
      const { serverMaxRevisionCounter } = await fs.readJSON(
        path.join(this.project.getPath(), '.sfdx-jayree', 'orgs', this.org.getUsername(), 'storedMaxRevision.json'),
        { throws: false }
      );
      storedServerMaxRevisionCounter = serverMaxRevisionCounter;
      // eslint-disable-next-line no-empty
    } catch {}

    const { records } = await conn.tooling.query(
      `SELECT RevisionCounter,RevisionNum,Id,MemberType,MemberName,IsNameObsolete from SourceMember where RevisionCounter >= ${
        this.flags.revision > 0
          ? this.flags.revision
          : storedServerMaxRevisionCounter
          ? storedServerMaxRevisionCounter
          : 0
      }`
    );

    let sourceMemberResults = records.map((SourceMember: any) => {
      const RevisionCounter =
        SourceMember.RevisionCounter >= SourceMember.RevisionNum
          ? SourceMember.RevisionCounter
          : SourceMember.RevisionNum;
      return {
        ...SourceMember,
        RevisionCounter,
        RevisionCounterString: `${RevisionCounter}${RevisionCounter === maxRev ? ' [remote]' : ''}${
          RevisionCounter === maxrevfile ? ' [local]' : ''
        }${RevisionCounter === storedServerMaxRevisionCounter ? ' [stored]' : ''}`,
      };
    });

    if (!sourceMemberResults.find((SourceMember) => SourceMember.RevisionCounter === maxrevfile)) {
      sourceMemberResults.push({
        RevisionCounter: maxrevfile,
        RevisionCounterString: `${maxrevfile} [local]${
          maxrevfile === storedServerMaxRevisionCounter ? ' [stored]' : ''
        }`,
        Id: 'unknown',
        MemberType: 'unknown',
        IsNameObsolete: 'unknown',
        MemberName: 'unknown',
      });
    }

    if (storedServerMaxRevisionCounter) {
      if (
        !sourceMemberResults.find((SourceMember) => SourceMember.RevisionCounter === storedServerMaxRevisionCounter)
      ) {
        sourceMemberResults.push({
          RevisionCounter: storedServerMaxRevisionCounter,
          RevisionCounterString: `${storedServerMaxRevisionCounter} [stored]`,
          Id: 'unknown',
          MemberType: 'unknown',
          IsNameObsolete: 'unknown',
          MemberName: 'unknown',
        });
      }
    }

    sourceMemberResults = sourceMemberResults.sort((a, b) => {
      const x = a.RevisionCounter;
      const y = b.RevisionCounter;
      return x < y ? -1 : x > y ? 1 : 0;
    });

    this.ux.styledHeader(chalk.blue(`SourceMember revision counter numbers list for: ${this.org.getUsername()}`));
    this.ux.table(sourceMemberResults, {
      columns: [
        {
          key: 'RevisionCounter',
          get: (row: any) => row.RevisionCounterString,
        },
        {
          key: 'Id',
        },
        {
          key: 'IsNameObsolete',
        },
        {
          key: 'MemberType',
        },
        {
          key: 'MemberName',
        },
      ],
    });

    sourceMemberResults.forEach((sourceMember) => {
      delete sourceMember.RevisionNum;
      delete sourceMember.RevisionCounterString;
    });

    const maxRevision = { remote: maxRev, local: maxrevfile };
    if (storedServerMaxRevisionCounter) {
      maxRevision['stored'] = storedServerMaxRevisionCounter;
    }

    return {
      maxRevision,
      sourceMemberResults,
      username: this.org.getUsername(),
    };
  }
}
