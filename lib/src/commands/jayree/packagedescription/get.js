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
const adm_zip_1 = (0, tslib_1.__importDefault)(require("adm-zip"));
const xml_1 = require("../../../utils/xml");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');
class GetPackageDescription extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const zip = new adm_zip_1.default(inputfile);
        const zipEntries = zip.getEntries();
        let text;
        zipEntries.forEach((zipEntry) => {
            const fileName = zipEntry.entryName;
            if (fileName.includes('package.xml')) {
                const fileContent = zip.readAsText(fileName);
                const xml = (0, xml_1.parseManifest)(fileContent);
                text = xml.Package.description ? xml.Package.description.toString() : '';
                this.ux.log(text);
            }
        });
        return { description: text };
    }
}
exports.default = GetPackageDescription;
// hotfix to receive only one help page
// public static hidden = true;
GetPackageDescription.description = messages.getMessage('commandDescription');
GetPackageDescription.examples = [
    `$ sfdx jayree:packagedescription:get --file FILENAME
    Description of Package FILENAME
    `,
];
GetPackageDescription.args = [{ name: 'file' }];
GetPackageDescription.flagsConfig = {
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
        required: true,
    }),
};
GetPackageDescription.requiresUsername = false;
GetPackageDescription.supportsDevhubUsername = false;
GetPackageDescription.requiresProject = false;
//# sourceMappingURL=get.js.map