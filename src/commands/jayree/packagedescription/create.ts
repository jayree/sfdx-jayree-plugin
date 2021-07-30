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
import { builder } from '../../../utils/xml';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'createpackagedescription');

export default class CreatePackageDescription extends SfdxCommand {
  // hotfix to receive only one help page
  // public static hidden = true;

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
    `,
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true,
    }),
    description: flags.string({
      char: 'd',
      description: messages.getMessage('descriptionFlagDescription'),
      dependsOn: ['file'],
      required: true,
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    const inputfile = this.args.file || this.flags.file;
    const newZip = new AdmZip();
    const text = this.flags.description.replace(/\\n/g, '\n');

    const fileContentjs = {
      Package: {
        $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
        description: [text],
        version: ['52.0'],
      },
    };

    newZip.addFile('unpackaged/package.xml', Buffer.from(builder.buildObject(fileContentjs)), '', 0o644);

    newZip.writeZip(inputfile);
    // this.ux.log(newZip.getEntries()[0].header.toString());
    this.ux.log(text);

    return { description: text, task: 'created' };
  }
}
