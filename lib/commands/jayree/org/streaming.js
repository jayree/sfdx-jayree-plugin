/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'streaming');
export default class Streaming extends SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
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
Streaming.description = messages.getMessage('commandDescription');
Streaming.examples = [
    `$ sfdx jayree:org:streaming --topic=/event/eventName__e
...
`,
];
Streaming.flagsConfig = {
    topic: flags.string({
        char: 'p',
        required: true,
        description: messages.getMessage('topicFlagDescription'),
    }),
};
Streaming.requiresUsername = true;
Streaming.supportsDevhubUsername = false;
Streaming.requiresProject = false;
//# sourceMappingURL=streaming.js.map