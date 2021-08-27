"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = (0, tslib_1.__importStar)(require("path"));
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = (0, tslib_1.__importStar)(require("fs-extra"));
const chalk_1 = (0, tslib_1.__importDefault)(require("chalk"));
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingget');
class ScratchOrgRevisionInfo extends command_1.SfdxCommand {
    async run() {
        const { serverMaxRevisionCounter } = await fs.readJSON(path.join(this.project.getPath(), '.sfdx-jayree', 'orgs', this.org.getUsername(), 'storedMaxRevision.json'), { throws: false });
        this.ux.styledHeader(chalk_1.default.blue('Get stored SourceMember revision counter number'));
        this.ux.table([{ username: this.org.getUsername(), serverMaxRevisionCounter: serverMaxRevisionCounter.toString() }], {
            columns: [
                {
                    key: 'Username',
                    get: (row) => row.username,
                },
                {
                    key: 'RevisionCounter',
                    get: (row) => row.serverMaxRevisionCounter,
                },
            ],
        });
        return {
            revision: serverMaxRevisionCounter,
            username: this.org.getUsername(),
        };
    }
}
exports.default = ScratchOrgRevisionInfo;
ScratchOrgRevisionInfo.description = messages.getMessage('commandDescription');
ScratchOrgRevisionInfo.examples = [
    `$ sfdx jayree:source:tracking:store:get
$ sfdx jayree:source:tracking:store:get -u me@my.org`,
];
ScratchOrgRevisionInfo.requiresUsername = true;
ScratchOrgRevisionInfo.supportsDevhubUsername = false;
ScratchOrgRevisionInfo.requiresProject = true;
//# sourceMappingURL=get.js.map