"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const path = require("path");
const sourceRetrieveBase_1 = require("../../../sourceRetrieveBase");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');
class FixMetadata extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        const projectpath = this.project.getPath();
        try {
            const configfile = '.sfdx-jayree.json';
            let config;
            try {
                config = require(path.join(projectpath, configfile));
            }
            catch (error) {
                // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
            }
            if (config) {
                for (const tag of this.flags.tag) {
                    if (config[tag]) {
                        const c = config[tag];
                        for (const workarounds of Object.keys(c)) {
                            for (const workaround of Object.keys(c[workarounds])) {
                                if (c[workarounds][workaround].isactive === true) {
                                    if (c[workarounds][workaround].files) {
                                        this.log("'" + workaround + "'");
                                        if (c[workarounds][workaround].files.delete) {
                                            await this.sourcedelete(c[workarounds][workaround].files.delete, projectpath);
                                        }
                                        if (c[workarounds][workaround].files.modify) {
                                            await this.sourcefix(c[workarounds][workaround].files.modify, projectpath, this.org.getConnection());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
        finally {
        }
        return {};
    }
}
exports.default = FixMetadata;
FixMetadata.description = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
FixMetadata.flagsConfig = {
    tag: command_1.flags.array({
        char: 't',
        description: messages.getMessage('tag')
    }),
    verbose: command_1.flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log')
    })
};
FixMetadata.requiresUsername = true;
FixMetadata.supportsDevhubUsername = false;
FixMetadata.requiresProject = true;
//# sourceMappingURL=fix.js.map