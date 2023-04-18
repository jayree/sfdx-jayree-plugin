/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, SfCommand, optionalOrgFlagWithDeprecations, arrayWithDeprecation } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { applyFixes, logFixes } from '../../../utils/souceUtils.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');
// eslint-disable-next-line sf-plugin/command-example
class FixMetadata extends SfCommand {
    async run() {
        const { flags } = await this.parse(FixMetadata);
        let updatedfiles = {};
        try {
            updatedfiles = await applyFixes(flags.tag);
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
FixMetadata.summary = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
FixMetadata.flags = {
    'target-org': optionalOrgFlagWithDeprecations,
    tag: arrayWithDeprecation({
        char: 't',
        summary: messages.getMessage('tag'),
    }),
    verbose: Flags.boolean({
        summary: messages.getMessage('log'),
        description: messages.getMessage('log'),
    }),
};
FixMetadata.requiresProject = true;
export default FixMetadata;
//# sourceMappingURL=fix.js.map