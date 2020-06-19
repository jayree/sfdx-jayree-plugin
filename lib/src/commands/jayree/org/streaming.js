"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'streaming');
class Streaming extends command_1.SfdxCommand {
    async run() {
        // await this.org.refreshAuth();
        const conn = this.org.getConnection();
        // '/event/SAPAccountRequest__e'
        conn.streaming.topic(this.flags.topic).subscribe((event) => {
            this.ux.logJson(event);
        });
        return {
            orgId: this.org.getOrgId()
        };
    }
}
exports.default = Streaming;
Streaming.description = messages.getMessage('commandDescription');
Streaming.examples = [
    `$ sfdx jayree:streaming --topic=/event/eventName__e
...
`
];
Streaming.flagsConfig = {
    topic: command_1.flags.string({
        char: 'p',
        required: true,
        description: messages.getMessage('topicFlagDescription')
    })
};
Streaming.requiresUsername = true;
Streaming.supportsDevhubUsername = false;
Streaming.requiresProject = false;
//# sourceMappingURL=streaming.js.map