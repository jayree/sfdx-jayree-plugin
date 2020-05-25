"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const AdmZip = require("adm-zip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'setpackagedescription');
let SetPackageDescription = /** @class */ (() => {
    class SetPackageDescription extends command_1.SfdxCommand {
        async run() {
            const inputfile = this.args.file || this.flags.file;
            const newZip = new AdmZip();
            const zip = new AdmZip(inputfile);
            const zipEntries = zip.getEntries();
            const text = this.flags.description.replace(/\\n/g, '\n');
            let action;
            zipEntries.forEach((zipEntry) => {
                const fileName = zipEntry.entryName;
                const fileContent = zip.readFile(fileName);
                if (fileName.includes('package.xml')) {
                    let fileContentjs;
                    const fileTXTContent = zip.readAsText(fileName);
                    const xml = convert.xml2js(fileTXTContent, { compact: true });
                    if ('description' in xml['Package']) {
                        xml['Package']['description'] = text;
                        action = 'updated';
                        fileContentjs = xml;
                    }
                    else {
                        fileContentjs = {
                            _declaration: {
                                _attributes: { version: '1.0', encoding: 'utf-8' }
                            },
                            Package: [
                                {
                                    _attributes: {
                                        xmlns: 'http://soap.sforce.com/2006/04/metadata'
                                    },
                                    description: text,
                                    types: xml['Package']['types'],
                                    version: xml['Package']['version']
                                }
                            ]
                        };
                        action = 'added';
                    }
                    this.ux.log(action + ' description: ' + text);
                    newZip.addFile(fileName, Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })), '', 0o644);
                }
                else {
                    newZip.addFile(fileName, fileContent, '', 0o644);
                }
            });
            newZip.writeZip(inputfile);
            return { description: text, task: action };
        }
    }
    // hotfix to receive only one help page
    // public static hidden = true;
    SetPackageDescription.description = messages.getMessage('commandDescription');
    SetPackageDescription.examples = [
        `$ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
    `
    ];
    SetPackageDescription.args = [{ name: 'file' }];
    SetPackageDescription.flagsConfig = {
        file: command_1.flags.string({
            char: 'f',
            description: messages.getMessage('fileFlagDescription'),
            required: true
        }),
        description: command_1.flags.string({
            char: 'd',
            description: messages.getMessage('descriptionFlagDescription'),
            dependsOn: ['file'],
            required: true
        })
    };
    SetPackageDescription.requiresUsername = false;
    SetPackageDescription.supportsDevhubUsername = false;
    SetPackageDescription.requiresProject = false;
    return SetPackageDescription;
})();
exports.default = SetPackageDescription;
//# sourceMappingURL=set.js.map