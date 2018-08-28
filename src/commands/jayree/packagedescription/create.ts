import { core, flags, SfdxCommand } from '@salesforce/command';
import * as AdmZip from 'adm-zip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createpackagedescription');

export default class SetPackageDescription extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
    `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({ char: 'f', description: messages.getMessage('fileFlagDescription') }),
    description: flags.string({ char: 'd', description: messages.getMessage('descriptionFlagDescription') })
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<core.AnyJson> {

    try {

      const inputfile = this.args.file || this.flags.file;
      const newZip = new AdmZip();
      const text = this.flags.description;
      let action;

      const fileContentjs = {
        _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
        Package: [{
          _attributes: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
          description: text,
          version: '43.0'
        }]
      };
      action = 'created';

      newZip.addFile('unpackaged/package.xml', Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })), '', 0o644);

      newZip.writeZip(inputfile);
      this.ux.log(text);

      return { description: text, task: action };
    } catch (err) {
      this.ux.error(err);
    }
  }
}
