"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const JSZip = require("jszip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'removepackagedescription');
class RemovePackageDescription extends command_1.SfdxCommand {
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const zip = await JSZip.loadAsync(await fs.readFile(inputfile));
        const packagexmlfile = Object.keys(zip.files).filter(name => name.includes('package.xml'));
        let action;
        let text;
        if (packagexmlfile.length === 1) {
            const fileContent = await zip.file(packagexmlfile).async('string');
            const xml = convert.xml2js(fileContent, { compact: true });
            if ('description' in xml['Package']) {
                text = xml['Package']['description']['_text'];
                action = 'removed';
                this.ux.log(action + ' description: ' + text);
                const fileContentjs = {
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
                zip.file(packagexmlfile, convert.js2xml(fileContentjs, { compact: true, spaces: 4 }));
            }
            else {
                action = '';
                this.ux.log('no description found');
            }
            if (action === 'removed') {
                zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(fs.createWriteStream(inputfile));
            }
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