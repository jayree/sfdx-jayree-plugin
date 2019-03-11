import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import serializeError = require('serialize-error');
import * as util from 'util';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgrevision');

/* istanbul ignore else*/
if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line: no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

export default class ScratchOrgRevisionInfo extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:scratchorgrevision
$ sfdx jayree:scratchorgrevision -u me@my.org
$ sfdx jayree:scratchorgrevision -u MyTestOrg1 -w`
  ];

  protected static flagsConfig = {
    startfromrevision: flags.integer({
      char: 'r',
      description: messages.getMessage('startfromrevision'),
      default: 0
    }),
    setlocalmaxrevision: flags.boolean({
      char: 's',
      description: messages.getMessage('setlocalmaxrevision')
    }),
    storerevision: flags.boolean({
      char: 'b',
      description: messages.getMessage('storerevision')
    }),
    restorerevision: flags.boolean({
      char: 'r',
      description: messages.getMessage('restorerevision'),
      dependsOn: ['setlocalmaxrevision'],
      exclusive: ['localrevisionvalue', 'storerevision']
    }),
    localrevisionvalue: flags.integer({
      char: 'v',
      description: messages.getMessage('localrevisionvalue'),
      dependsOn: ['setlocalmaxrevision']
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
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

    const maxRev = await conn.tooling.query('SELECT MAX(RevisionNum) maxRev from SourceMember').then(result => {
      if (!util.isNullOrUndefined(result) && result.records.length > 0) {
        return Promise.resolve(result.records[0]['maxRev']);
      }
      return Promise.reject(Error('invalidResponseFromQuery'));
    });

    const maxrevpath = path.join(
      await this.project.getPath(),
      '.sfdx',
      'orgs',
      this.org.getUsername(),
      'maxrevision.json'
    );

    const storedmaxrevpath = path.join(
      await this.project.getPath(),
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      'storedmaxrevision.json'
    );

    let maxrevfile;

    await fs
      .readFile(maxrevpath, 'utf8')
      .then(data => {
        maxrevfile = parseInt(data, 10);
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          maxrevfile = 0;
        } else {
          this.throwError(err);
        }
      });

    let storedmaxrevfile;

    await fs
      .readFile(storedmaxrevpath, 'utf8')
      .then(data => {
        storedmaxrevfile = parseInt(data, 10);
      })
      .catch(err => {
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
      await fs.writeFile(maxrevpath, newlocalmaxRev).catch(err => {
        this.throwError(err);
      });
    }

    if (this.flags.storerevision) {
      await fs.ensureFile(storedmaxrevpath);
      await fs.writeFile(storedmaxrevpath, newstoredmaxrev).catch(err => {
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
      .sobject('SourceMember')
      .find({ RevisionNum: { $gt: this.flags.startfromrevision } }, ['RevisionNum', 'MemberType', 'MemberName'])
      .then(results => {
        let islocalinmap = false;
        let isstoredinmap = false;

        const tablemap = results.map(value => {
          const keyval = value['RevisionNum'];
          if (keyval === newlocalmaxRev) {
            islocalinmap = true;
          }
          if (keyval === newstoredmaxrev) {
            isstoredinmap = true;
          }
          if (keyval === maxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [remote]';
          }
          if (keyval === newlocalmaxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [local]';
          }
          if (keyval === newstoredmaxrev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [stored]';
          }
          if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [local(old)]';
          }
          return [keyval, value];
        });

        if (!islocalinmap) {
          const keyval = newlocalmaxRev;
          const value = [];
          value['RevisionNum'] = newlocalmaxRev;
          if (keyval === maxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [remote]';
          }
          if (keyval === newlocalmaxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [local]';
          }
          if (keyval === newstoredmaxrev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [stored]';
          }
          if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
            value['RevisionNum'] = value['RevisionNum'] + ' [local(old)]';
          }
          tablemap.push([keyval, value]);
        }

        if (newstoredmaxrev !== newlocalmaxRev) {
          if (!isstoredinmap) {
            const keyval = newstoredmaxrev;
            const value = [];
            value['RevisionNum'] = newstoredmaxrev;
            if (keyval === maxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [remote]';
            }
            if (keyval === newlocalmaxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [local]';
            }
            if (keyval === newstoredmaxrev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [stored]';
            }
            if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [local(old)]';
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
          .map(value => {
            return {
              ...(value[1] as {})
            };
          });
      })) as [];

    this.ux.table(sourceMemberResults, {
      columns: [
        {
          key: 'RevisionNum'
        },
        {
          key: 'MemberType'
        },
        {
          key: 'MemberName'
        }
      ]
    });

    return {
      maxrevision: { remote: maxRev, local: newlocalmaxRev },
      orgId: this.org.getOrgId(),
      username: this.org.getUsername()
    };
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    this.logger.error({ err: serializeError(err) });
    throw err;
  }
}
