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
    setlocalrevision: flags.integer({
      char: 'v',
      description: messages.getMessage('setlocalrevision'),
      default: 0,
      dependsOn: ['setlocalmaxrevision']
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
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
    let maxrevfile;

    await fs
      .readFile(maxrevpath, 'utf8')
      .then(data => {
        maxrevfile = parseInt(data, 10);
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          maxrevfile = null;
        } else {
          this.throwError(err);
        }
      });

    let newlocalmaxRev = maxrevfile;

    if (this.flags.setlocalmaxrevision) {
      newlocalmaxRev = this.flags.setlocalrevision || maxRev;
      await fs.ensureFile(maxrevpath);
      await fs.writeFile(maxrevpath, newlocalmaxRev).catch(err => {
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
      .then(results =>
        results
          .map(value => {
            const keyval = value['RevisionNum'];
            if (keyval === maxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [remote]';
            }
            if (keyval === newlocalmaxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [local]';
            }
            if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
              value['RevisionNum'] = value['RevisionNum'] + ' [local(old)]';
            }
            return [keyval, value];
          })
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
          })
      )) as [];

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
