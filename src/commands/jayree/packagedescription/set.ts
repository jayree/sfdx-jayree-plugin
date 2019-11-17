import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as JSZip from 'jszip';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'setpackagedescription');

export default class SetPackageDescription extends SfdxCommand {
  // hotfix to receive only one help page
  // public static hidden = true;

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
    `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true
    }),
    description: flags.string({
      char: 'd',
      description: messages.getMessage('descriptionFlagDescription'),
      dependsOn: ['file'],
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

    const text = this.flags.description.replace(/\\n/g, '\n');
    let action;

    if (packagexmlfile.length === 1) {
      const fileContent = await zip.file(packagexmlfile).async('string');
      const xml = convert.xml2js(fileContent, { compact: true });
      let fileContentjs;

      if ('description' in xml['Package']) {
        xml['Package']['description'] = text;
        action = 'updated';
        fileContentjs = xml;
      } else {
        fileContentjs = {
          _declaration: {
            _attributes: { version: '1.0', encoding: 'utf-8' }
          },
          Package: [
            {
              _attributes: {
                xmlns: 'http://soap.sforce.com/2006/04/metadata'
              },
              description: text,
              types: xml['Package']['types'],
              version: xml['Package']['version']
            }
          ]
        };
        action = 'added';
      }
      this.ux.log(action + ' description: ' + text);
      zip.file(packagexmlfile, convert.js2xml(fileContentjs, { compact: true, spaces: 4 }));
      zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(fs.createWriteStream(inputfile));
    }

    return { description: text, task: action };
  }
}
