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
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'setpackagedescription');
class SetPackageDescription extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const newZip = new adm_zip_1.default();
        const zip = new adm_zip_1.default(inputfile);
        const zipEntries = zip.getEntries();
        const text = this.flags.description.replace(/\\n/g, '\n');
        let action;
        zipEntries.forEach((zipEntry) => {
            const fileName = zipEntry.entryName;
            const fileContent = zip.readFile(fileName);
            if (fileName.includes('package.xml')) {
                const fileTXTContent = zip.readAsText(fileName);
                const xml = (0, xml_1.parseManifest)(fileTXTContent);
                if (xml.Package.description && xml.Package.description.length > 0) {
                    action = 'updated';
                }
                else {
                    action = 'added';
                }
                xml.Package['description'] = text;
                this.ux.log(action + ' description: ' + text);
                newZip.addFile(fileName, Buffer.from((0, xml_1.js2Manifest)(xml)), '', 0o644);
            }
            else {
                newZip.addFile(fileName, fileContent, '', 0o644);
            }
        });
        newZip.writeZip(inputfile);
        return { description: text, task: action };
    }
}
exports.default = SetPackageDescription;
// hotfix to receive only one help page
// public static hidden = true;
SetPackageDescription.description = messages.getMessage('commandDescription');
SetPackageDescription.examples = [
    `$ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
    `,
];
SetPackageDescription.args = [{ name: 'file' }];
SetPackageDescription.flagsConfig = {
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
SetPackageDescription.requiresUsername = false;
SetPackageDescription.supportsDevhubUsername = false;
SetPackageDescription.requiresProject = false;
//# sourceMappingURL=set.js.map