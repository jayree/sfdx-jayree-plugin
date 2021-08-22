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
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const xml_1 = require("../../../utils/xml");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'removepackagedescription');
class RemovePackageDescription extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const newZip = new adm_zip_1.default();
        const zip = new adm_zip_1.default(inputfile);
        const zipEntries = zip.getEntries();
        let action;
        let text;
        zipEntries.forEach((zipEntry) => {
            const fileName = zipEntry.entryName;
            const fileContent = zip.readFile(fileName);
            if (fileName.includes('package.xml')) {
                let fileContentjs;
                const fileTXTContent = zip.readAsText(fileName);
                const xml = xml_1.parseManifest(fileTXTContent);
                if (xml.Package.description && xml.Package.description.length > 0) {
                    text = xml.Package.description.toString();
                    action = 'removed';
                    this.ux.log(action + ' description: ' + text);
                    fileContentjs = {
                        Package: {
                            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
                            types: xml.Package.types,
                            version: xml.Package.version,
                        },
                    };
                    newZip.addFile(fileName, Buffer.from(xml_1.js2Manifest(fileContentjs)), '', 0o644);
                }
                else {
                    action = '';
                    this.ux.log('no description found');
                }
            }
            else {
                newZip.addFile(fileName, fileContent, '', 0o644);
            }
        });
        if (action === 'removed') {
            newZip.writeZip(inputfile);
        }
        // eslint-disable-next-line camelcase
        return { old_description: text, task: action };
    }
}
exports.default = RemovePackageDescription;
// hotfix to receive only one help page
// public static hidden = true;
RemovePackageDescription.description = messages.getMessage('commandDescription');
RemovePackageDescription.examples = [
    `$ sfdx jayree:packagedescription:remove --file FILENAME
    `,
];
RemovePackageDescription.args = [{ name: 'file' }];
RemovePackageDescription.flagsConfig = {
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
        required: true,
    }),
};
RemovePackageDescription.requiresUsername = false;
RemovePackageDescription.supportsDevhubUsername = false;
RemovePackageDescription.requiresProject = false;
//# sourceMappingURL=remove.js.map