/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);

const messages = Messages.loadMessages('sfdx-jayree', 'streaming');

export default class Streaming extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:org:streaming --topic=/event/eventName__e
...
`,
  ];

  protected static flagsConfig = {
    topic: flags.string({
      char: 'p',
      required: true,
      description: messages.getMessage('topicFlagDescription'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();
    const conn = this.org.getConnection();
    // '/event/SAPAccountRequest__e'
    await conn.streaming.topic(this.flags.topic).subscribe((event) => {
      this.ux.logJson(event);
    });

    return {
      orgId: this.org.getOrgId(),
    };
  }
}
