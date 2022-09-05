/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getCurrentStateFolderFilePath } from '../../../../../utils/stateFolderHandler.js';
Messages.importMessagesDirectory(new URL('./', import.meta.url).pathname);
const messages = Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingget');
export default class ScratchOrgRevisionInfo extends SfdxCommand {
    async run() {
        const { serverMaxRevisionCounter } = await fs.readJSON(await getCurrentStateFolderFilePath(this.project.getPath(), path.join('orgs', this.org.getOrgId(), 'jayreeStoredMaxRevision.json'), true), { throws: false });
        this.ux.styledHeader(chalk.blue('Get stored SourceMember revision counter number'));
        this.ux.table([
            {
                username: this.org.getUsername(),
                orgid: this.org.getOrgId(),
                serverMaxRevisionCounter: serverMaxRevisionCounter.toString(),
            },
        ], {
            Username: {
                header: 'Username',
                get: (row) => row.username,
            },
            OrgId: {
                header: 'OrgId',
                get: (row) => row.orgid,
            },
            RevisionCounter: {
                header: 'RevisionCounter',
                get: (row) => row.serverMaxRevisionCounter,
            },
        });
        return {
            revision: serverMaxRevisionCounter,
            username: this.org.getUsername(),
        };
    }
}
ScratchOrgRevisionInfo.description = messages.getMessage('commandDescription');
ScratchOrgRevisionInfo.examples = [
    `$ sfdx jayree:source:tracking:store:get
$ sfdx jayree:source:tracking:store:get -u me@my.org`,
];
ScratchOrgRevisionInfo.requiresUsername = true;
ScratchOrgRevisionInfo.supportsDevhubUsername = false;
ScratchOrgRevisionInfo.requiresProject = true;
//# sourceMappingURL=get.js.map