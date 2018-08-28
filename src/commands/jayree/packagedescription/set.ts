import { core, flags, SfdxCommand } from '@salesforce/command';
import * as AdmZip from 'adm-zip';
import * as convert from 'xml-js';
// import * as xml2js from 'xml2js';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-jayree', 'setpackagedescription');

export default class PackageDescription extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagexml --targetusername myOrg@example.com
    <?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
  `
  ];

  // public static args = [{ config: 'configfile' }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    // name: flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription') }),
    config: flags.string({ char: 'c', description: messages.getMessage('configFlagDescription') }),
    quickfilter: flags.string({ char: 'q', description: messages.getMessage('quickfilterFlagDescription') }),
    excludemanaged: flags.boolean({ char: 'x', description: messages.getMessage('excludeManagedFlagDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<core.AnyJson> {

    try {

      // create a zip object to hold the new zip files
      const newZip = new AdmZip();

      // reading archives
      const zip = new AdmZip('package.zip');
      const zipEntries = zip.getEntries(); // an array of ZipEntry records

      zipEntries.forEach(zipEntry => {
        const fileName = zipEntry.entryName;
        const fileContent = zip.readAsText(fileName);
        if (fileName.includes('package.xml')) {
          const x = convert.xml2js(fileContent, {compact: true});
          x['Package']['Description'] = 'asbc';
          const packageJson = {
            _declaration: {_attributes: {version: '1.0', encoding: 'utf-8'}},
            Package: [{
              _attributes: {xmlns: 'http://soap.sforce.com/2006/04/metadata'},
              description: 'blublub',
              types: x['Package']['types'],
              version: x['Package']['version']
            }]
          };
          const y = convert.js2xml(packageJson, { compact: true, spaces: 4 });
          newZip.addFile(fileName, y.toString(), '', 0o644);
        } else {
          newZip.addFile(fileName, fileContent, '', 0o644);
        }
        // const newFileName = fileName.substring(fileName.indexOf('/') + 1);
      });

      newZip.writeZip('package.zip');  // write the new zip

      // Return an object to be displayed with --json
      return { orgId: this.org.getOrgId() };
    } catch (err) {
      console.error(err);
    }
  }
}
