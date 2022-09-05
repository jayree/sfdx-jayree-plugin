/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { applyFixes, logFixes } from '../../../utils/souceUtils.js';
Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);
const messages = Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');
export default class FixMetadata extends SfdxCommand {
    async run() {
        let updatedfiles = {};
        try {
            updatedfiles = await applyFixes(this.flags.tag);
            // eslint-disable-next-line no-empty
        }
        finally {
        }
        await logFixes(updatedfiles);
        return {
            fixedFiles: Object.values(updatedfiles)
                .filter((value) => value.length > 0)
                .reduce((acc, val) => acc.concat(val), []),
            details: updatedfiles,
        };
    }
}
FixMetadata.description = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
FixMetadata.flagsConfig = {
    tag: flags.array({
        char: 't',
        description: messages.getMessage('tag'),
    }),
    verbose: flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log'),
    }),
};
FixMetadata.supportsUsername = true;
FixMetadata.supportsDevhubUsername = false;
FixMetadata.requiresProject = true;
//# sourceMappingURL=fix.js.map