import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'streaming');

export default class Streaming extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:streaming --topic=/event/eventName__e
...
`
  ];

  protected static flagsConfig = {
    topic: flags.string({
      char: 'p',
      required: true,
      description: messages.getMessage('topicFlagDescription')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    // await this.org.refreshAuth();
    const conn = this.org.getConnection();
    // '/event/SAPAccountRequest__e'
    conn.streaming.topic(this.flags.topic).subscribe(event => {
      this.ux.logJson(event);
    });

    return {
      orgId: this.org.getOrgId()
    };
  }
}
