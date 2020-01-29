"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'flowtestcoverage');
class Streaming extends command_1.SfdxCommand {
    async run() {
        await this.org.refreshAuth();
        const conn = this.org.getConnection();
        conn.streaming.topic('/event/Send_Accounts_to_SAP__e').subscribe(event => {
            console.log(event);
        });
        return {
            orgId: this.org.getOrgId()
        };
    }
}
exports.default = Streaming;
Streaming.description = messages.getMessage('commandDescription');
Streaming.examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
];
Streaming.requiresUsername = true;
Streaming.supportsDevhubUsername = false;
Streaming.requiresProject = false;
//# sourceMappingURL=streaming.js.map