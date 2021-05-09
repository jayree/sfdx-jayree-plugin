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
const util = tslib_1.__importStar(require("util"));
const command_1 = require("@salesforce/command");
const fs = tslib_1.__importStar(require("fs-extra"));
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'scratchorgrevision');
class ScratchOrgRevisionInfo extends command_1.SfdxCommand {
    async run() {
        if (!this.flags.setlocalmaxrevision) {
            // workaround as 0 is not a valid flag value at all
            if (this.flags.localrevisionvalue === 0) {
                throw Error('--setlocalmaxrevision= must also be provided when using --localrevisionvalue=');
            }
        }
        if (this.flags.restorerevision) {
            // workaround as 0 is not a valid flag value at all
            if (this.flags.localrevisionvalue === 0) {
                throw Error('--localrevisionvalue= cannot also be provided when using --restorerevision=');
            }
        }
        const conn = this.org.getConnection();
        const maxRev = await conn.tooling.query('SELECT MAX(RevisionCounter) maxRev from SourceMember').then((result) => {
            if (!util.isNullOrUndefined(result) && result.records.length > 0) {
                return Promise.resolve(result.records[0]['maxRev']);
            }
            return Promise.reject(Error('invalidResponseFromQuery'));
        });
        const maxrevpath = path.join(
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await this.project.getPath(), '.sfdx', 'orgs', this.org.getUsername(), 'maxRevision.json');
        const storedmaxrevpath = path.join(
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await this.project.getPath(), '.sfdx-jayree', 'orgs', this.org.getUsername(), 'storedmaxrevision.json');
        let maxrevfile;
        await fs
            .readFile(maxrevpath, 'utf8')
            .then((data) => {
            try {
                const json = JSON.parse(data);
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
                    // based on the current bug this should be 0 but this might be correct if the bug is fixed
                    maxrevfile = json.serverMaxRevisionCounter;
                }
            }
            catch {
                maxrevfile = parseInt(data, 10);
            }
        })
            .catch((err) => {
            if (err.code === 'ENOENT') {
                maxrevfile = 0;
            }
            else {
                this.throwError(err);
            }
        });
        let storedmaxrevfile;
        await fs
            .readFile(storedmaxrevpath, 'utf8')
            .then((data) => {
            storedmaxrevfile = parseInt(data, 10);
        })
            .catch((err) => {
            if (err.code === 'ENOENT') {
                storedmaxrevfile = 0;
            }
            else {
                this.throwError(err);
            }
        });
        let newlocalmaxRev = maxrevfile;
        let newstoredmaxrev = storedmaxrevfile;
        if (this.flags.setlocalmaxrevision) {
            // newlocalmaxRev = this.flags.localrevisionvalue >= 0 ? this.flags.localrevisionvalue : maxRev;
            newlocalmaxRev = this.flags.restorerevision
                ? storedmaxrevfile
                : this.flags.localrevisionvalue >= 0
                    ? this.flags.localrevisionvalue
                    : maxRev;
            newstoredmaxrev = this.flags.storerevision ? newlocalmaxRev : newstoredmaxrev;
            await fs.ensureFile(maxrevpath);
            await fs
                .writeFile(maxrevpath, JSON.stringify({ serverMaxRevisionCounter: newlocalmaxRev, sourceMembers: {} }, null, 4))
                .catch((err) => {
                this.throwError(err);
            });
        }
        if (this.flags.storerevision) {
            await fs.ensureFile(storedmaxrevpath);
            await fs.writeFile(storedmaxrevpath, newstoredmaxrev.toString()).catch((err) => {
                this.throwError(err);
            });
        }
        this.ux.styledHeader(this.org.getUsername());
        this.ux.log('remote maxrevision: ' + maxRev);
        this.ux.log('local maxrevision: ' + newlocalmaxRev);
        if (maxrevfile !== newlocalmaxRev) {
            this.ux.log('local(old) maxrevision: ' + maxrevfile);
        }
        const sourceMemberResults = (await conn.tooling
            .query(`SELECT RevisionCounter,RevisionNum,Id,MemberType,MemberName,IsNameObsolete from SourceMember where RevisionCounter >= ${this.flags.startfromrevision}`)
            .then((results) => {
            // eslint-disable-next-line no-console
            let islocalinmap = false;
            let isstoredinmap = false;
            const tablemap = results.records.map((value) => {
                value['RevisionCounter'] =
                    value['RevisionCounter'] >= value['RevisionNum'] ? value['RevisionCounter'] : value['RevisionNum'];
                const keyval = value['RevisionCounter'];
                if (keyval === newlocalmaxRev) {
                    islocalinmap = true;
                }
                if (keyval === newstoredmaxrev) {
                    isstoredinmap = true;
                }
                if (keyval === maxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
                }
                if (keyval === newlocalmaxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
                }
                if (keyval === newstoredmaxrev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
                }
                if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
                }
                return [keyval, value];
            });
            if (!islocalinmap) {
                const keyval = newlocalmaxRev;
                const value = [];
                value['RevisionCounter'] = newlocalmaxRev;
                if (keyval === maxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
                }
                if (keyval === newlocalmaxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
                }
                if (keyval === newstoredmaxrev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
                }
                if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
                    value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
                }
                tablemap.push([keyval, value]);
            }
            if (newstoredmaxrev !== newlocalmaxRev) {
                if (!isstoredinmap) {
                    const keyval = newstoredmaxrev;
                    const value = [];
                    value['RevisionCounter'] = newstoredmaxrev;
                    if (keyval === maxRev) {
                        value['RevisionCounter'] = value['RevisionCounter'] + ' [remote]';
                    }
                    if (keyval === newlocalmaxRev) {
                        value['RevisionCounter'] = value['RevisionCounter'] + ' [local]';
                    }
                    if (keyval === newstoredmaxrev) {
                        value['RevisionCounter'] = value['RevisionCounter'] + ' [stored]';
                    }
                    if (keyval === maxrevfile && maxrevfile !== newlocalmaxRev) {
                        value['RevisionCounter'] = value['RevisionCounter'] + ' [local(old)]';
                    }
                    tablemap.push([keyval, value]);
                }
            }
            return tablemap
                .sort((a, b) => {
                if (a[0] === b[0]) {
                    return 0;
                }
                else {
                    return a[0] < b[0] ? -1 : 1;
                }
            })
                .map((value) => {
                return {
                    ...value[1],
                };
            });
        }));
        this.ux.table(sourceMemberResults, {
            columns: [
                {
                    key: 'RevisionCounter',
                },
                {
                    key: 'Id',
                },
                {
                    key: 'MemberType',
                },
                {
                    key: 'IsNameObsolete',
                },
                {
                    key: 'MemberName',
                },
            ],
        });
        return {
            maxrevision: { remote: maxRev, local: newlocalmaxRev, stored: newstoredmaxrev },
            orgId: this.org.getOrgId(),
            username: this.org.getUsername(),
        };
    }
    throwError(err) {
        this.ux.stopSpinner();
        throw err;
    }
}
exports.default = ScratchOrgRevisionInfo;
ScratchOrgRevisionInfo.description = messages.getMessage('commandDescription');
ScratchOrgRevisionInfo.hidden = true;
ScratchOrgRevisionInfo.examples = [
    `$ sfdx jayree:scratchorgrevision
$ sfdx jayree:scratchorgrevision -u me@my.org
$ sfdx jayree:scratchorgrevision -u MyTestOrg1 -w`,
];
ScratchOrgRevisionInfo.flagsConfig = {
    startfromrevision: command_1.flags.integer({
        char: 'i',
        hidden: true,
        description: messages.getMessage('startfromrevision'),
        default: 0,
    }),
    setlocalmaxrevision: command_1.flags.boolean({
        char: 's',
        description: messages.getMessage('setlocalmaxrevision'),
    }),
    storerevision: command_1.flags.boolean({
        char: 'b',
        description: messages.getMessage('storerevision'),
        exclusive: ['restorerevision'],
    }),
    restorerevision: command_1.flags.boolean({
        char: 'r',
        description: messages.getMessage('restorerevision'),
        dependsOn: ['setlocalmaxrevision'],
        exclusive: ['localrevisionvalue', 'storerevision'],
    }),
    localrevisionvalue: command_1.flags.integer({
        char: 'v',
        description: messages.getMessage('localrevisionvalue'),
        dependsOn: ['setlocalmaxrevision'],
    }),
};
ScratchOrgRevisionInfo.requiresUsername = true;
ScratchOrgRevisionInfo.supportsDevhubUsername = false;
ScratchOrgRevisionInfo.requiresProject = true;
//# sourceMappingURL=revision.js.map