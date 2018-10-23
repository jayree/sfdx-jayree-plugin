import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as AdmZip from 'adm-zip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'removepackagedescription');

export default class RemovePackageDescription extends SfdxCommand {

  // hotfix to receive only one help page
  // public static hidden = true;

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:remove --file FILENAME
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
    const newZip = new AdmZip();

    const zip = new AdmZip(inputfile);
    const zipEntries = zip.getEntries();

    let action;
    let text;
    zipEntries.forEach(zipEntry => {
      const fileName = zipEntry.entryName;
      const fileContent = zip.readFile(fileName);
      if (fileName.includes('package.xml')) {
        let fileContentjs;
        const fileTXTContent = zip.readAsText(fileName);
        const xml = convert.xml2js(fileTXTContent, { compact: true });
        if ('description' in xml['Package']) {
          text = xml['Package']['description']['_text'];
          action = 'removed';
          this.ux.log(action + ' description: ' + text);
          fileContentjs = {
            _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
            Package: [{
              _attributes: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
              types: xml['Package']['types'],
              version: xml['Package']['version']
            }]
          };
          newZip.addFile(fileName, Buffer.from(convert.js2xml(fileContentjs, { compact: true, spaces: 4 })), '', 0o644);
        } else {
          action = '';
          this.ux.log('no description found');
        }
      } else {
        newZip.addFile(fileName, fileContent, '', 0o644);
      }
    });
    if (action === 'removed') {
      newZip.writeZip(inputfile);
    }

    return { old_description: text, task: action };

  }
}
