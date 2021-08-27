"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const souceUtils_1 = require("../../../utils/souceUtils");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');
class FixMetadata extends command_1.SfdxCommand {
    async run() {
        let updatedfiles = {};
        try {
            updatedfiles = await (0, souceUtils_1.applyFixes)(this.flags.tag);
            // eslint-disable-next-line no-empty
        }
        finally {
        }
        await (0, souceUtils_1.logFixes)(updatedfiles);
        return {
            fixedFiles: Object.values(updatedfiles)
                .filter((value) => value.length > 0)
                .reduce((acc, val) => acc.concat(val), []),
            details: updatedfiles,
        };
    }
}
exports.default = FixMetadata;
FixMetadata.description = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
FixMetadata.flagsConfig = {
    tag: command_1.flags.array({
        char: 't',
        description: messages.getMessage('tag'),
    }),
    verbose: command_1.flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log'),
    }),
};
FixMetadata.supportsUsername = true;
FixMetadata.supportsDevhubUsername = false;
FixMetadata.requiresProject = true;
//# sourceMappingURL=fix.js.map