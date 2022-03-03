"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const adm_zip_1 = __importDefault(require("adm-zip"));
const xml_1 = require("../../../utils/xml");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'createpackagedescription');
class CreatePackageDescription extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const inputfile = this.args.file || this.flags.file;
        const newZip = new adm_zip_1.default();
        const text = this.flags.description.replace(/\\n/g, '\n');
        const fileContentjs = {
            Package: {
                description: [text],
                version: ['52.0'],
            },
        };
        newZip.addFile('unpackaged/package.xml', Buffer.from((0, xml_1.js2Manifest)(fileContentjs)), '', 0o644);
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