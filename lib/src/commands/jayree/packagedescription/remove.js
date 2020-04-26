"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const AdmZip = require("adm-zip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'removepackagedescription');
class RemovePackageDescription extends command_1.SfdxCommand {
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const newZip = new AdmZip();
        const zip = new AdmZip(inputfile);
        const zipEntries = zip.getEntries();
        let action;
        let text;
        zipEntries.forEach(zipEntry => {
            const fileName = zipEntry.entryName;
            const fileContent = zip.readFile(fileName);
            if (fileName.includes('package.xml')) {
                let fileContentjs;
                const fileTXTContent = zip.readAsText(fileName);
                const xml = convert.xml2js(fileTXTContent, { compact: true });
                if ('description' in xml['Package']) {
                    text = xml['Package']['description']['_text'];
                    action = 'removed';
                    this.ux.log(action + ' description: ' + text);
                    fileContentjs = {
                        _declaration: {
                            _attributes: { version: '1.0', encoding: 'utf-8' }
                        },
                        Package: [
                            {
                                _attributes: {
                                    xmlns: 'http://soap.sforce.com/2006/04/metadata'
                                },
                                types: xml['Package']['types'],
                                version: xml['Package']['version']
                            }
                        ]
                    };
                    newZip.addFile(fileName, Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })), '', 0o644);
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
        return { old_description: text, task: action };
    }
}
exports.default = RemovePackageDescription;
// hotfix to receive only one help page
// public static hidden = true;
RemovePackageDescription.description = messages.getMessage('commandDescription');
RemovePackageDescription.examples = [
    `$ sfdx jayree:packagedescription:remove --file FILENAME
    `
];
RemovePackageDescription.args = [{ name: 'file' }];
RemovePackageDescription.flagsConfig = {
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
        required: true
    })
};
RemovePackageDescription.requiresUsername = false;
RemovePackageDescription.supportsDevhubUsername = false;
RemovePackageDescription.requiresProject = false;
//# sourceMappingURL=remove.js.map