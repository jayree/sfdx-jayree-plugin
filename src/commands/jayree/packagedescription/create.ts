/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as AdmZip from 'adm-zip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createpackagedescription');

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
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
      Package: [
        {
          _attributes: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
          description: text,
          version: '43.0',
        },
      ],
    };

    newZip.addFile(
      'unpackaged/package.xml',
      Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })),
      '',
      0o644
    );

    newZip.writeZip(inputfile);
    // this.ux.log(newZip.getEntries()[0].header.toString());
    this.ux.log(text);

    return { description: text, task: 'created' };
  }
}
