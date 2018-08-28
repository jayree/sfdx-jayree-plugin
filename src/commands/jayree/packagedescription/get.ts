import { core, flags, SfdxCommand } from '@salesforce/command';
import * as AdmZip from 'adm-zip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');

export default class GetPackageDescription extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:get --file FILENAME
    Description of Package FILENAME
    `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({ char: 'f', description: messages.getMessage('fileFlagDescription') })
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<core.AnyJson> {

    try {

      const inputfile = this.args.file || this.flags.file;

      const zip = new AdmZip(inputfile);
      const zipEntries = zip.getEntries();

      let text;
      zipEntries.forEach(zipEntry => {
        const fileName = zipEntry.entryName;
        const fileContent = zip.readAsText(fileName);
        if (fileName.includes('package.xml')) {
          text = convert.xml2js(fileContent, { compact: true })['Package']['description']['_text'];
        }
      });

      this.ux.log(text);

      return { description: text };
    } catch (err) {
      this.ux.error(err);
    }
  }
}
