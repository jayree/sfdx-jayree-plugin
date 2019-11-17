import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as JSZip from 'jszip';
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

    const zip = await JSZip.loadAsync(await fs.readFile(inputfile));
    const packagexmlfile = Object.keys(zip.files).filter(name => name.includes('package.xml'));

    let action;
    let text;

    if (packagexmlfile.length === 1) {
      const fileContent = await zip.file(packagexmlfile).async('string');
      const xml = convert.xml2js(fileContent, { compact: true });
      if ('description' in xml['Package']) {
        text = xml['Package']['description']['_text'];
        action = 'removed';
        this.ux.log(action + ' description: ' + text);
        const fileContentjs = {
          _declaration: {
            _attributes: { version: '1.0', encoding: 'utf-8' }
          },
          Package: [
            {
              _attributes: {
                xmlns: 'http://soap.sforce.com/2006/04/metadata'
              },
              types: xml['Package']['types'],
              version: xml['Package']['version']
            }
          ]
        };
        zip.file(packagexmlfile, convert.js2xml(fileContentjs, { compact: true, spaces: 4 }));
      } else {
        action = '';
        this.ux.log('no description found');
      }
      if (action === 'removed') {
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(fs.createWriteStream(inputfile));
      }
    }

    return { old_description: text, task: action };
  }
}
