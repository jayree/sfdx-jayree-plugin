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
const path = __importStar(require("path"));
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const fs = __importStar(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'scratchorgtrackingset');
class ScratchOrgRevisionInfo extends command_1.SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const { records: [{ maxCounter, maxNum }], } = await conn.tooling.query('SELECT MAX(RevisionCounter) maxCounter,MAX(RevisionNum) maxNum from SourceMember');
        let maxRev = maxCounter >= maxNum ? maxCounter : maxNum;
        if (!maxRev) {
            maxRev = 0;
        }
        const storedmaxrevpath = path.join(this.project.getPath(), '.sfdx', 'orgs', this.org.getOrgId(), 'jayreeStoredMaxRevision.json');
        const newMaxRev = this.flags.revision >= 0 ? this.flags.revision : maxRev;
        await fs.ensureFile(storedmaxrevpath);
        await fs.writeJSON(storedmaxrevpath, { serverMaxRevisionCounter: newMaxRev });
        this.ux.styledHeader(chalk_1.default.blue('Set stored SourceMember revision counter number'));
        this.ux.table([
            {
                username: this.org.getUsername(),
                orgid: this.org.getOrgId(),
                serverMaxRevisionCounter: newMaxRev.toString(),
            },
        ], {
            columns: [
                {
                    key: 'Username',
                    get: (row) => row.username,
                },
                {
                    key: 'OrgId',
                    get: (row) => row.orgid,
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