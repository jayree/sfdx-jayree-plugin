import { core, flags, SfdxCommand } from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import * as AdmZip from 'adm-zip';
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
    file: flags.string({ char: 'f', description: messages.getMessage('fileFlagDescription'), required: true })
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    const inputfile = this.args.file || this.flags.file;

    const zip = new AdmZip(inputfile);
    const zipEntries = zip.getEntries();

    let text;
    zipEntries.forEach(zipEntry => {
      const fileName = zipEntry.entryName;
      const fileContent = zip.readAsText(fileName);
      if (fileName.includes('package.xml')) {
        text = convert.xml2js(fileContent, { compact: true });
        if ('description' in text['Package']) {
          text = text['Package']['description']['_text'];
          this.ux.log(text);
        } else {
          text = '';
        }
      }
    });
    return { description: text };

  }
}
