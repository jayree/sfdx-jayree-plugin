"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const convert = tslib_1.__importStar(require("xml-js"));
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'createpackagedescription');
class CreatePackageDescription extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const newZip = new adm_zip_1.default();
        const text = this.flags.description.replace(/\\n/g, '\n');
        const fileContentjs = {
            _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
            Package: [
                {
                    _attributes: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
                    description: text,
                    version: '43.0',
                },
            ],
        };
        newZip.addFile('unpackaged/package.xml', Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })), '', 0o644);
        newZip.writeZip(inputfile);
        // this.ux.log(newZip.getEntries()[0].header.toString());
        this.ux.log(text);
        return { description: text, task: 'created' };
    }
}
exports.default = CreatePackageDescription;
// hotfix to receive only one help page
// public static hidden = true;
CreatePackageDescription.description = messages.getMessage('commandDescription');
CreatePackageDescription.examples = [
    `$ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
    `,
];
CreatePackageDescription.args = [{ name: 'file' }];
CreatePackageDescription.flagsConfig = {
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
        required: true,
    }),
    description: command_1.flags.string({
        char: 'd',
        description: messages.getMessage('descriptionFlagDescription'),
        dependsOn: ['file'],
        required: true,
    }),
};
CreatePackageDescription.requiresUsername = false;
CreatePackageDescription.supportsDevhubUsername = false;
CreatePackageDescription.requiresProject = false;
//# sourceMappingURL=create.js.map