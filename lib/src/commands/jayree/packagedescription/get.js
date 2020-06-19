"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const AdmZip = require("adm-zip");
const convert = require("xml-js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');
class GetPackageDescription extends command_1.SfdxCommand {
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const zip = new AdmZip(inputfile);
        const zipEntries = zip.getEntries();
        let text;
        zipEntries.forEach((zipEntry) => {
            const fileName = zipEntry.entryName;
            if (fileName.includes('package.xml')) {
                const fileContent = zip.readAsText(fileName);
                text = convert.xml2js(fileContent, { compact: true });
                if ('description' in text['Package']) {
                    text = text['Package']['description']['_text'];
                    this.ux.log(text);
                }
                else {
                    text = '';
                }
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