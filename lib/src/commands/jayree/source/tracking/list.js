"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
const path = __importStar(require("path"));
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = __importStar(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackinglist');
class SourceTrackingList extends command_1.SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const { records: [{ maxCounter, maxNum }], } = await conn.tooling.query('SELECT MAX(RevisionCounter) maxCounter,MAX(RevisionNum) maxNum from SourceMember');
        const maxRev = maxCounter >= maxNum ? maxCounter : maxNum;
        const maxrevpath = path.join(this.project.getPath(), '.sfdx', 'orgs', this.org.getOrgId(), 'maxRevision.json');
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
            const { serverMaxRevisionCounter } = await fs.readJSON(path.join(this.project.getPath(), '.sfdx', 'orgs', this.org.getOrgId(), 'jayreeStoredMaxRevision.json'), { throws: false });
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
        this.ux.styledHeader(chalk_1.default.blue(`SourceMember revision counter numbers list for: ${this.org.getUsername()}/${this.org.getOrgId()}`));
        this.ux.table(sourceMemberResults, {
            columns: [
                {
                    key: 'REVISIONCOUNTER',
                    get: (row) => row.RevisionCounterString,
                },
                {
                    key: 'ID',
                    get: (row) => row.Id,
                },
                {
                    key: 'FULL NAME',
                    get: (row) => row.MemberName,
                },
                {
                    key: 'TYPE',
                    get: (row) => row.MemberType,
                },
                {
                    key: 'OBSOLETE',
                    get: (row) => row.IsNameObsolete.toString(),
                },
            ],
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
exports.default = SourceTrackingList;
SourceTrackingList.description = messages.getMessage('commandDescription');
SourceTrackingList.examples = [
    `$ sfdx jayree:source:tracking:list
$ sfdx jayree:source:tracking:list -u me@my.org
$ sfdx jayree:source:tracking:list -u me@my.org -r 101`,
];
SourceTrackingList.flagsConfig = {
    revision: command_1.flags.integer({
        char: 'r',
        description: messages.getMessage('startrevision'),
        default: 0,
    }),
};
SourceTrackingList.requiresUsername = true;
SourceTrackingList.supportsDevhubUsername = false;
SourceTrackingList.requiresProject = true;
//# sourceMappingURL=list.js.map