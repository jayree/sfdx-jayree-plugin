"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const JSZip = require("jszip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');
class GetPackageDescription extends command_1.SfdxCommand {
    async run() {
        const inputfile = this.args.file || this.flags.file;
        let text;
        const zip = await JSZip.loadAsync(await fs.readFile(inputfile));
        const packagexmlfile = Object.keys(zip.files).filter(name => name.includes('package.xml'));
        if (packagexmlfile.length === 1) {
            const fileContent = await zip.file(packagexmlfile).async('string');
            text = convert.xml2js(fileContent, { compact: true });
            if ('description' in text['Package']) {
                text = text['Package']['description']['_text'];
                this.ux.log(text);
            }
            else {
                text = '';
            }
        }
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
    `
];
GetPackageDescription.args = [{ name: 'file' }];
GetPackageDescription.flagsConfig = {
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
        required: true
    })
};
GetPackageDescription.requiresUsername = false;
GetPackageDescription.supportsDevhubUsername = false;
GetPackageDescription.requiresProject = false;
//# sourceMappingURL=get.js.map