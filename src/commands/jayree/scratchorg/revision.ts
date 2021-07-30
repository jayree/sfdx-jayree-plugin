/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as util from 'util';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'scratchorgrevision');

export default class ScratchOrgRevisionInfo extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');
  public static hidden = true;

  public static examples = [
    `$ sfdx jayree:scratchorg:revision
$ sfdx jayree:scratchorg:revision -u me@my.org
$ sfdx jayree:scratchorg:revision -u MyTestOrg1 -w`,
  ];

  protected static flagsConfig = {
    startfromrevision: flags.integer({
      char: 'i',
      hidden: true,
      description: messages.getMessage('startfromrevision'),
      default: 0,
    }),
    setlocalmaxrevision: flags.boolean({
      char: 's',
      description: messages.getMessage('setlocalmaxrevision'),
    }),
    storerevision: flags.boolean({
      char: 'b',
      description: messages.getMessage('storerevision'),
      exclusive: ['restorerevision'],
    }),
    restorerevision: flags.boolean({
      char: 'r',
      description: messages.getMessage('restorerevision'),
      dependsOn: ['setlocalmaxrevision'],
      exclusive: ['localrevisionvalue', 'storerevision'],
    }),
    localrevisionvalue: flags.integer({
      char: 'v',
      description: messages.getMessage('localrevisionvalue'),
      dependsOn: ['setlocalmaxrevision'],
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    this.ux.warn('You are using a deprecated command. Use instead: jayree:source:tracking:list|store:set|get');
    if (!this.flags.setlocalmaxrevision) {
      // workaround as 0 is not a valid flag value at all
      if (this.flags.localrevisionvalue === 0) {
        throw Error('--setlocalmaxrevision= must also be provided when using --localrevisionvalue=');
      }
    }

    if (this.flags.restorerevision) {
      // workaround as 0 is not a valid flag value at all
      if (this.flags.localrevisionvalue === 0) {
        throw Error('--localrevisionvalue= cannot also be provided when using --restorerevision=');
      }
    }

    const conn = this.org.getConnection();

    const maxRev = await conn.tooling.query('SELECT MAX(RevisionCounter) maxRev from SourceMember').then((result) => {
      if (!util.isNullOrUndefined(result) && result.records.length > 0) {
        return Promise.resolve(result.records[0]['maxRev']);
      }
      return Promise.reject(Error('invalidResponseFromQuery'));
    });

    const maxrevpath = path.join(
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.project.getPath(),
      '.sfdx',
      'orgs',
      this.org.getUsername(),
      'maxRevision.json'
    );

    const storedmaxrevpath = path.join(
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.project.getPath(),
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      'storedmaxrevision.json'
    );

    let maxrevfile;

    await fs
      .readFile(maxrevpath, 'utf8')
      .then((data) => {
        try {
          const json = JSON.parse(data);
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
            // based on the current bug this should be 0 but this might be correct if the bug is fixed
            maxrevfile = json.serverMaxRevisionCounter;
          }
        } catch {
          maxrevfile = parseInt(data, 10);
        }
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          maxrevfile = 0;
        } else {
          this.throwError(err);
        }
      });

    let storedmaxrevfile;

    await fs
      .readFile(storedmaxrevpath, 'utf8')
      .then((data) => {
        storedmaxrevfile = parseInt(data, 10);
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          storedmaxrevfile = 0;
        } else {
          this.throwError(err);
        }
      });

    let newlocalmaxRev = maxrevfile;
    let newstoredmaxrev = storedmaxrevfile;

    if (this.flags.setlocalmaxrevision) {
      // newlocalmaxRev = this.flags.localrevisionvalue >= 0 ? this.flags.localrevisionvalue : maxRev;
      newlocalmaxRev = this.flags.restorerevision
        ? storedmaxrevfile
        : this.flags.localrevisionvalue >= 0
        ? this.flags.localrevisionvalue
        : maxRev;
      newstoredmaxrev = this.flags.storerevision ? newlocalmaxRev : newstoredmaxrev;
      await fs.ensureFile(maxrevpath);
      await fs
        .writeFile(maxrevpath, JSON.stringify({ serverMaxRevisionCounter: newlocalmaxRev, sourceMembers: {} }, null, 4))
        .catch((err) => {
          this.throwError(err);
        });
    }

    if (this.flags.storerevision) {
      await fs.ensureFile(storedmaxrevpath);
      await fs.writeFile(storedmaxrevpath, newstoredmaxrev.toString()).catch((err) => {
        this.throwError(err);
      });
    }

    this.ux.styledHeader(this.org.getUsername());
    this.ux.log('remote maxrevision: ' + maxRev);
    this.ux.log('local maxrevision: ' + newlocalmaxRev);
    if (maxrevfile !== newlocalmaxRev) {
      this.ux.log('local(old) maxrevision: ' + maxrevfile);
    }

    const sourceMemberResults = (await conn.tooling
      .query(
        `SELECT RevisionCounter,RevisionNum,Id,MemberType,MemberName,IsNameObsolete from SourceMember where RevisionCounter >= ${this.flags.startfromrevision}`
      )
      .then((results) => {
        // eslint-disable-next-line no-console
        let islocalinmap = false;
        let isstoredinmap = false;
        const tablemap = results.records.map((value) => {
          value['RevisionCounter'] =
            value['RevisionCounter'] >= value['RevisionNum'] ? value['RevisionCounter'] : value['RevisionNum'];
          const keyval = value['RevisionCounter'];
          if (keyval === newlocalmaxRev) {
            islocalinmap = true;
          }
          if (keyval === newstoredmaxrev) {
            isstoredinmap = true;
          }
          if (keyval === maxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
          }
          if (keyval === newlocalmaxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
          }
          if (keyval === newstoredmaxrev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
          }
          if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
          }
          return [keyval, value];
        });

        if (!islocalinmap) {
          const keyval = newlocalmaxRev;
          const value = [];
          value['RevisionCounter'] = newlocalmaxRev;
          if (keyval === maxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
          }
          if (keyval === newlocalmaxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
          }
          if (keyval === newstoredmaxrev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
          }
          if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
            value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
          }
          tablemap.push([keyval, value]);
        }

        if (newstoredmaxrev !== newlocalmaxRev) {
          if (!isstoredinmap) {
            const keyval = newstoredmaxrev;
            const value = [];
            value['RevisionCounter'] = newstoredmaxrev;
            if (keyval === maxRev) {
              value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
            }
            if (keyval === newlocalmaxRev) {
              value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
            }
            if (keyval === newstoredmaxrev) {
              value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
            }
            if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
              value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
            }
            tablemap.push([keyval, value]);
          }
        }

        return tablemap
          .sort((a, b) => {
            if (a[0] === b[0]) {
              return 0;
            } else {
              return a[0] < b[0] ? -1 : 1;
            }
          })
          .map((value) => {
            return {
              ...(value[1] as Record<string, unknown>),
            };
          });
      })) as [];

    this.ux.table(sourceMemberResults, {
      columns: [
        {
          key: 'RevisionCounter',
        },
        {
          key: 'Id',
        },
        {
          key: 'MemberType',
        },
        {
          key: 'IsNameObsolete',
        },
        {
          key: 'MemberName',
        },
      ],
    });

    return {
      maxrevision: { remote: maxRev, local: newlocalmaxRev, stored: newstoredmaxrev },
      orgId: this.org.getOrgId(),
      username: this.org.getUsername(),
    };
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    throw err;
  }
}
