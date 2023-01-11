/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getCurrentStateFolderFilePath } from '../../../../utils/stateFolderHandler.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'scratchorgtrackinglist');
export default class SourceTrackingList extends SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const { records: [{ maxCounter, maxNum }], } = await conn.tooling.query('SELECT MAX(RevisionCounter) maxCounter,MAX(RevisionNum) maxNum from SourceMember');
        const maxRev = maxCounter >= maxNum ? maxCounter : maxNum;
        const maxrevpath = await getCurrentStateFolderFilePath(this.project.getPath(), join('orgs', this.org.getOrgId(), 'maxRevision.json'), false);
        let maxrevfile;
        try {
            const json = await fs.readJSON(maxrevpath);
            if (Object.keys(json.sourceMembers).length > 0) {
                maxrevfile = Math.max(0, ...Object.keys(json.sourceMembers).map((key) => json.sourceMembers[key].lastRetrievedFromServer));
                if (maxrevfile === 0) {
                    maxrevfile = Math.min(...Object.keys(json.sourceMembers).map((key) => json.sourceMembers[key].serverRevisionCounter));
                    if (maxrevfile !== 0) {
                        maxrevfile = maxrevfile - 1;
                    }
                }
            }
            else {
                // support resetting local source tracking with sourceMembers={}
                maxrevfile = json.serverMaxRevisionCounter;
            }
        }
        catch {
            maxrevfile = 0;
        }
        let storedServerMaxRevisionCounter;
        try {
            const { serverMaxRevisionCounter } = await fs.readJSON(await getCurrentStateFolderFilePath(this.project.getPath(), join('orgs', this.org.getOrgId(), 'jayreeStoredMaxRevision.json'), true), { throws: false });
            storedServerMaxRevisionCounter = serverMaxRevisionCounter;
            // eslint-disable-next-line no-empty
        }
        catch { }
        const { records } = await conn.tooling.query(`SELECT RevisionCounter,RevisionNum,Id,MemberType,MemberName,IsNameObsolete from SourceMember where RevisionCounter >= ${this.flags.revision > 0
            ? this.flags.revision
            : storedServerMaxRevisionCounter
                ? storedServerMaxRevisionCounter
                : 0}`);
        let sourceMemberResults = records.map((SourceMember) => {
            const RevisionCounter = SourceMember.RevisionCounter >= SourceMember.RevisionNum
                ? SourceMember.RevisionCounter
                : SourceMember.RevisionNum;
            return {
                ...SourceMember,
                RevisionCounter,
                RevisionCounterString: `${RevisionCounter}${RevisionCounter === maxRev ? ' [remote]' : ''}${RevisionCounter === maxrevfile ? ' [local]' : ''}${RevisionCounter === storedServerMaxRevisionCounter ? ' [stored]' : ''}`,
            };
        });
        if (!sourceMemberResults.find((SourceMember) => SourceMember.RevisionCounter === maxrevfile)) {
            sourceMemberResults.push({
                RevisionCounter: maxrevfile,
                RevisionCounterString: `${maxrevfile} [local]${maxrevfile === storedServerMaxRevisionCounter ? ' [stored]' : ''}`,
                Id: 'unknown',
                MemberType: 'unknown',
                IsNameObsolete: 'unknown',
                MemberName: 'unknown',
            });
        }
        if (storedServerMaxRevisionCounter) {
            if (!sourceMemberResults.find((SourceMember) => SourceMember.RevisionCounter === storedServerMaxRevisionCounter)) {
                sourceMemberResults.push({
                    RevisionCounter: storedServerMaxRevisionCounter,
                    RevisionCounterString: `${storedServerMaxRevisionCounter} [stored]`,
                    Id: 'unknown',
                    MemberType: 'unknown',
                    IsNameObsolete: 'unknown',
                    MemberName: 'unknown',
                });
            }
        }
        sourceMemberResults = sourceMemberResults.sort((a, b) => {
            const x = a.RevisionCounter;
            const y = b.RevisionCounter;
            return x < y ? -1 : x > y ? 1 : 0;
        });
        this.ux.styledHeader(chalk.blue(`SourceMember revision counter numbers list for: ${this.org.getUsername()}/${this.org.getOrgId()}`));
        this.ux.table(sourceMemberResults, {
            REVISIONCOUNTER: {
                header: 'REVISIONCOUNTER',
                get: (row) => row.RevisionCounterString,
            },
            ID: {
                header: 'ID',
                get: (row) => row.Id,
            },
            'FULL NAME': {
                header: 'FULL NAME',
                get: (row) => row.MemberName,
            },
            TYPE: {
                header: 'TYPE',
                get: (row) => row.MemberType,
            },
            OBSOLETE: {
                header: 'OBSOLETE',
                get: (row) => row.IsNameObsolete.toString(),
            },
        });
        sourceMemberResults.forEach((sourceMember) => {
            delete sourceMember.RevisionNum;
            delete sourceMember.RevisionCounterString;
        });
        const maxRevision = { remote: maxRev, local: maxrevfile };
        if (storedServerMaxRevisionCounter) {
            maxRevision['stored'] = storedServerMaxRevisionCounter;
        }
        return {
            maxRevision,
            sourceMemberResults,
            username: this.org.getUsername(),
        };
    }
}
SourceTrackingList.description = messages.getMessage('commandDescription');
SourceTrackingList.examples = [
    `$ sfdx jayree:source:tracking:list
$ sfdx jayree:source:tracking:list -u me@my.org
$ sfdx jayree:source:tracking:list -u me@my.org -r 101`,
];
SourceTrackingList.flagsConfig = {
    revision: flags.integer({
        char: 'r',
        description: messages.getMessage('startrevision'),
        default: 0,
    }),
};
SourceTrackingList.requiresUsername = true;
SourceTrackingList.supportsDevhubUsername = false;
SourceTrackingList.requiresProject = true;
//# sourceMappingURL=list.js.map