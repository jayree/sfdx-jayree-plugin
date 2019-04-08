"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const opn = require("opn");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'openorg');
class OrgOpen extends command_1.SfdxCommand {
    async run() {
        let browser = '';
        switch (process.platform) {
            case 'win32':
                switch (this.flags.browser) {
                    case 'chrome':
                        browser = 'chrome';
                        break;
                    case 'firefox':
                        browser = 'firefox';
                        break;
                    case 'safari':
                        throw Error(this.flags.browser + ' is not supported on ' + process.platform);
                }
                break;
            case 'darwin':
                switch (this.flags.browser) {
                    case 'chrome':
                        browser = 'google chrome';
                        break;
                    case 'firefox':
                        browser = 'firefox';
                        break;
                    case 'safari':
                        browser = 'safari';
                        break;
                }
                break;
            case 'linux':
                switch (this.flags.browser) {
                    case 'chrome':
                        browser = 'google-chrome';
                        break;
                    case 'firefox':
                        browser = 'firefox';
                        break;
                    case 'safari':
                        throw Error(this.flags.browser + ' is not supported on ' + process.platform);
                }
                break;
            default:
                throw Error('OS ' + process.platform + ' is not supported yet.');
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
            opn(url, {
                app: browser,
                wait: false
            });
        }
        return {
            url,
            orgId: this.org.getOrgId(),
            username: this.org.getUsername()
        };
    }
}
OrgOpen.description = messages.getMessage('commandDescription');
OrgOpen.examples = [
    `$ sfdx jayree:org:open
$ sfdx jayree:org:open -u me@my.org
$ sfdx jayree:org:open -u MyTestOrg1 -b firefox
$ sfdx jayree:org:open -r -p lightning -b safari
$ sfdx jayree:org:open -u me@my.org`
];
OrgOpen.flagsConfig = {
    browser: command_1.flags.string({
        char: 'b',
        description: messages.getMessage('browserFlagDescription'),
        options: ['firefox', 'chrome', 'safari'],
        default: 'chrome'
    }),
    path: command_1.flags.string({
        char: 'p',
        description: messages.getMessage('pathFlagDescription')
    }),
    urlonly: command_1.flags.boolean({
        char: 'r',
        description: messages.getMessage('urlonlyFlagDescription')
    })
};
OrgOpen.requiresUsername = true;
OrgOpen.supportsDevhubUsername = false;
OrgOpen.requiresProject = false;
exports.default = OrgOpen;
//# sourceMappingURL=open.js.map