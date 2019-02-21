import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as util from 'util';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');

/* istanbul ignore else*/
if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line: no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

export default class ScratchOrgRevisionInfo extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:scratchorgsettings
$ sfdx jayree:scratchorgsettings -u me@my.org
$ sfdx jayree:scratchorgsettings -u MyTestOrg1 -w`
  ];

  protected static flagsConfig = {
    localfromrevision: flags.integer({
      char: 'r',
      description: messages.getMessage('writetoprojectscratchdeffile')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();

    const maxRev = await conn.tooling.query('SELECT MAX(RevisionNum) maxRev from SourceMember').then(result => {
      if (!util.isNullOrUndefined(result) && result.records.length > 0) {
        return Promise.resolve(result.records[0]['maxRev']);
      }
      return Promise.reject(Error('invalidResponseFromQuery'));
    });
    this.ux.styledHeader('MAX(RevisionNum): ' + maxRev);

    const sourceMemberResults = await conn.tooling
      .sobject('SourceMember')
      .find({ RevisionNum: { $gt: this.flags.localfromrevision } }, ['RevisionNum', 'MemberType', 'MemberName'])
      .then(results => {
        return results.map(sourceMember => {
          return {
            MemberType: sourceMember['MemberType'],
            MemberName: sourceMember['MemberName'],
            RevisionNum: sourceMember['RevisionNum']
          };
        });
      });

    const sortJson = (obj, key) => {
      return obj
        .map(value => {
          const keyval = value[key];
          delete value[key];
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
            [key]: value[0],
            ...(value[1] as {})
          };
        });
    };

    const sortedSourceMemberResults = sortJson(sourceMemberResults, 'RevisionNum');

    this.ux.table(sortedSourceMemberResults, {
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
      maxRev,
      sourceMember: sortedSourceMemberResults,
      orgId: this.org.getOrgId(),
      username: this.org.getUsername()
    };
  }
}
