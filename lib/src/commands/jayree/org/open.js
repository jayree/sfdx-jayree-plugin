"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const open_1 = (0, tslib_1.__importDefault)(require("open"));
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'openorg');
class OrgOpen extends command_1.SfdxCommand {
    async run() {
        let browser;
        switch (this.flags.browser) {
            case 'chrome':
                browser = open_1.default.apps.chrome;
                break;
            case 'firefox':
                browser = open_1.default.apps.firefox;
                break;
            case 'edge':
                browser = open_1.default.apps.edge;
                break;
            case 'safari':
                if (process.platform === 'darwin') {
                    browser = 'safari';
                    break;
                }
                throw Error(this.flags.browser + ' is not supported on ' + process.platform);
        }
        const conn = this.org.getConnection();
        let url = conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken;
        if (this.flags.path) {
            url = url + '&retURL=' + this.flags.path;
        }
        this.ux.log('Access org ' +
            this.org.getOrgId() +
            ' as user ' +
            this.org.getUsername() +
            ' with the following URL: ' +
            url +
            " using browser '" +
            browser +
            "'");
        /* istanbul ignore next */
        if (!this.flags.urlonly) {
            await (0, open_1.default)(url, {
                app: { name: browser },
                wait: false,
            });
        }
        return {
            url,
            orgId: this.org.getOrgId(),
            username: this.org.getUsername(),
        };
    }
}
exports.default = OrgOpen;
OrgOpen.description = messages.getMessage('commandDescription');
OrgOpen.examples = [
    `$ sfdx jayree:org:open
$ sfdx jayree:org:open -u me@my.org
$ sfdx jayree:org:open -u MyTestOrg1 -b firefox
$ sfdx jayree:org:open -r -p lightning -b safari
$ sfdx jayree:org:open -u me@my.org`,
];
OrgOpen.flagsConfig = {
    browser: command_1.flags.string({
        char: 'b',
        description: messages.getMessage('browserFlagDescription'),
        options: ['firefox', 'chrome', 'edge', 'safari'],
        default: 'chrome',
    }),
    path: command_1.flags.string({
        char: 'p',
        description: messages.getMessage('pathFlagDescription'),
    }),
    urlonly: command_1.flags.boolean({
        char: 'r',
        description: messages.getMessage('urlonlyFlagDescription'),
    }),
};
OrgOpen.requiresUsername = true;
OrgOpen.supportsDevhubUsername = false;
OrgOpen.requiresProject = false;
//# sourceMappingURL=open.js.map