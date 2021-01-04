"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = tslib_1.__importStar(require("path"));
const command_1 = require("@salesforce/command");
const fs = tslib_1.__importStar(require("fs-extra"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingset');
class ScratchOrgRevisionInfo extends command_1.SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const { records: [{ maxRev }], } = await conn.tooling.query('SELECT MAX(RevisionCounter) maxRev from SourceMember');
        const storedmaxrevpath = path.join(this.project.getPath(), '.sfdx-jayree', 'orgs', this.org.getUsername(), 'storedMaxRevision.json');
        const newMaxRev = this.flags.revision >= 0 ? this.flags.revision : maxRev;
        await fs.ensureFile(storedmaxrevpath);
        await fs.writeJSON(storedmaxrevpath, { serverMaxRevisionCounter: newMaxRev });
        this.ux.styledHeader(chalk_1.default.blue('Set stored SourceMember revision counter number'));
        this.ux.table([{ username: this.org.getUsername(), serverMaxRevisionCounter: newMaxRev.toString() }], {
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
            revision: newMaxRev,
            username: this.org.getUsername(),
        };
    }
}
exports.default = ScratchOrgRevisionInfo;
ScratchOrgRevisionInfo.description = messages.getMessage('commandDescription');
ScratchOrgRevisionInfo.examples = [
    `$ sfdx jayree:source:tracking:store:set
$ sfdx jayree:source:tracking:store:set -u me@my.org
$ sfdx jayree:source:tracking:store:set -u MyTestOrg1 -r 101`,
];
ScratchOrgRevisionInfo.flagsConfig = {
    revision: command_1.flags.integer({
        char: 'r',
        description: messages.getMessage('revision'),
    }),
};
ScratchOrgRevisionInfo.requiresUsername = true;
ScratchOrgRevisionInfo.supportsDevhubUsername = false;
ScratchOrgRevisionInfo.requiresProject = true;
//# sourceMappingURL=set.js.map