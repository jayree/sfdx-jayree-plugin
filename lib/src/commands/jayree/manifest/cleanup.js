"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const manifest_1 = require("../../../utils/manifest");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'manifestcleanup');
class CleanupManifest extends command_1.SfdxCommand {
    async run() {
        await manifest_1.cleanupManifestFile(this.flags.manifest, this.flags.file);
        return {};
    }
}
exports.default = CleanupManifest;
CleanupManifest.description = messages.getMessage('commandDescription');
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
CleanupManifest.flagsConfig = {
    manifest: command_1.flags.filepath({
        char: 'x',
        description: messages.getMessage('manifestFlagDescription'),
    }),
    file: command_1.flags.filepath({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
};
CleanupManifest.requiresUsername = false;
CleanupManifest.supportsDevhubUsername = false;
CleanupManifest.requiresProject = true;
//# sourceMappingURL=cleanup.js.map