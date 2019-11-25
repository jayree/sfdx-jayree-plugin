import { core, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'flowtestcoverage');

export default class Streaming extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ];

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();
    const conn = this.org.getConnection();

    conn.streaming.topic('/event/Account_Updates__e').subscribe(event => {
      console.log(event);
    });

    return {
      orgId: this.org.getOrgId()
    };
  }
}
