"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const JSZip = require("jszip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'setpackagedescription');
class SetPackageDescription extends command_1.SfdxCommand {
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const zip = await JSZip.loadAsync(await fs.readFile(inputfile));
        const packagexmlfile = Object.keys(zip.files).filter(name => name.includes('package.xml'));
        const text = this.flags.description.replace(/\\n/g, '\n');
        let action;
        if (packagexmlfile.length === 1) {
            const fileContent = await zip.file(packagexmlfile).async('string');
            const xml = convert.xml2js(fileContent, { compact: true });
            let fileContentjs;
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
            zip.file(packagexmlfile, convert.js2xml(fileContentjs, { compact: true, spaces: 4 }));
            zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(fs.createWriteStream(inputfile));
        }
        return { description: text, task: action };
    }
}
exports.default = SetPackageDescription;
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
//# sourceMappingURL=set.js.map