import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as JSZip from 'jszip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');

export default class GetPackageDescription extends SfdxCommand {
  // hotfix to receive only one help page
  // public static hidden = true;

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:get --file FILENAME
    Description of Package FILENAME
    `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true
    })
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
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
      } else {
        text = '';
      }
    }

    return { description: text };
  }
}
