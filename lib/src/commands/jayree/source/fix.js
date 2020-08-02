"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require("path");
const command_1 = require("@salesforce/command");
const chalk = require("chalk");
const sourceRetrieveBase_1 = require("../../../sourceRetrieveBase");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');
class FixMetadata extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        const projectpath = this.project.getPath();
        let updatedfiles = [];
        try {
            const configfile = '.sfdx-jayree.json';
            let config;
            try {
                config = require(path.join(projectpath, configfile));
            }
            catch (error) {
                // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
            }
            updatedfiles = await this.applyfixes(config, this.flags.tag, projectpath);
            // eslint-disable-next-line no-empty
        }
        finally {
        }
        Object.keys(updatedfiles).forEach((workaround) => {
            if (updatedfiles[workaround].length > 0) {
                this.ux.styledHeader(chalk.blue(`Fixed Source: ${workaround}`));
                this.ux.table(updatedfiles[workaround], {
                    columns: [
                        {
                            key: 'filePath',
                            label: 'FILEPATH',
                        },
                        {
                            key: 'operation',
                            label: 'OPERATION',
                        },
                        {
                            key: 'message',
                            label: 'MESSAGE',
                        },
                    ],
                });
            }
        });
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
FixMetadata.requiresUsername = true;
FixMetadata.supportsDevhubUsername = false;
FixMetadata.requiresProject = true;
//# sourceMappingURL=fix.js.map