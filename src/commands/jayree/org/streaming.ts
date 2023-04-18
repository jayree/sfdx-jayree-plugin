/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'streaming');

export default class Streaming extends SfCommand<AnyJson> {
  public static readonly summary = messages.getMessage('commandDescription');

  public static readonly examples = [
    `$ sfdx jayree:org:streaming --topic=/event/eventName__e
...
`,
  ];

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    topic: Flags.string({
      char: 'p',
      required: true,
      summary: messages.getMessage('topicFlagDescription'),
    }),
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    const { flags } = await this.parse(Streaming);
    await flags['target-org'].refreshAuth();
    const conn = flags['target-org'].getConnection(flags['api-version']);
    // '/event/SAPAccountRequest__e'
    await conn.streaming.topic(flags.topic).subscribe((event) => {
      this.styledJSON(event);
    });

    return {
      orgId: flags['target-org'].getOrgId(),
    };
  }
}
