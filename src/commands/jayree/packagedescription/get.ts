/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import AdmZip from 'adm-zip';
import { parseStringSync } from '../../../utils/xml';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'getpackagedescription');

export default class GetPackageDescription extends SfdxCommand {
  // hotfix to receive only one help page
  // public static hidden = true;

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:get --file FILENAME
    Description of Package FILENAME
    `,
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true,
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    const inputfile = this.args.file || this.flags.file;

    const zip = new AdmZip(inputfile);
    const zipEntries = zip.getEntries();

    let text;
    zipEntries.forEach((zipEntry) => {
      const fileName = zipEntry.entryName;
      if (fileName.includes('package.xml')) {
        const fileContent = zip.readAsText(fileName);
        const xml = parseStringSync(fileContent);
        text = xml.Package.description ? xml.Package.description.toString() : '';
        this.ux.log(text);
      }
    });
    return { description: text };
  }
}
