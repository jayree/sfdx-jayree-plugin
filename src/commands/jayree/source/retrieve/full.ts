import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as shell from 'shelljs';
import { sourcedelete, sourcefix } from '../../../../utils/fixmdsource';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefull');

export default class RetrieveProfiles extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ]; */

  protected static flagsConfig = {
    keepcache: flags.boolean({
      char: 'c',
      hidden: true,
      description: messages.getMessage('keepcache')
    }),
    types: flags.array({
      char: 't',
      description: messages.getMessage('types'),
      options: ['profiles', 'permsets', 'labels'],
      default: ['profiles', 'permsets', 'labels']
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();

    const json = raw => {
      try {
        return JSON.parse(raw).result;
      } catch (error) {
        return JSON.parse(raw.stderr);
      }
    };

    const projectpath = this.project.getPath();

    if (!this.flags.fixonly) {
      const orgretrievepath = path.join(
        projectpath,
        '.sfdx-jayree',
        'orgs',
        this.org.getUsername(),
        `sdx_retrieveProfiles_${Date.now()}`
      );

      try {
        this.ux.log(`Using ${orgretrievepath}`);

        await core.fs.mkdirp(orgretrievepath, core.fs.DEFAULT_USER_DIR_MODE);

        let out = json(
          shell.exec(
            `sfdx force:mdapi:retrieve --retrievetargetdir=. --unpackaged=${path.join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              '..',
              '..',
              'manifest',
              'package-profiles.xml'
            )} --targetusername=${this.org.getUsername()} --json`,
            { cwd: orgretrievepath, fatal: false, silent: true }
          )
        );

        if (out.success) {
          const zip = new AdmZip(out.zipFilePath);
          zip.extractAllTo(orgretrievepath);

          if (this.flags.types.includes('profiles')) {
            out = json(
              shell.exec(
                `sfdx force:mdapi:convert --metadata=Profile --outputdir=./src --rootdir=./unpackaged --json`,
                {
                  cwd: orgretrievepath,
                  fatal: false,
                  silent: true
                }
              )
            );
            if (!out.length) {
              throw new Error('Profile conversion failed');
            }
          }

          if (this.flags.types.includes('permsets')) {
            out = json(
              shell.exec(
                `sfdx force:mdapi:convert --metadata=PermissionSet --outputdir=./src --rootdir=./unpackaged --json`,
                {
                  cwd: orgretrievepath,
                  fatal: false,
                  silent: true
                }
              )
            );
            if (!out.length) {
              throw new Error('PermissionSet conversion failed');
            }
          }

          if (this.flags.types.includes('labels')) {
            out = json(
              shell.exec(
                `sfdx force:mdapi:convert --metadata=CustomLabels --outputdir=./src --rootdir=./unpackaged --json`,
                {
                  cwd: orgretrievepath,
                  fatal: false,
                  silent: true
                }
              )
            );
            if (!out.length) {
              throw new Error('CustomLabels conversion failed');
            }
          }

          shell.mv(path.join(orgretrievepath, 'src'), path.join(orgretrievepath, 'force-app'));

          const configfile = '.sfdx-jayree.json';
          let config;
          try {
            config = require(path.join(projectpath, configfile));
          } catch (error) {
            // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
          }
          if (config) {
            if (config['source:retrieve:full']) {
              config = config['source:retrieve:full'];
              for (const workarounds of Object.keys(config)) {
                for (const workaround of Object.keys(config[workarounds])) {
                  if (config[workarounds][workaround].isactive === true) {
                    if (config[workarounds][workaround].files) {
                      if (config[workarounds][workaround].files.delete) {
                        await sourcedelete(config[workarounds][workaround].files.delete, orgretrievepath);
                      }
                      if (config[workarounds][workaround].files.modify) {
                        await sourcefix(config[workarounds][workaround].files.modify, orgretrievepath);
                      }
                    }
                  }
                }
              }
            } else {
              /* this.ux.warn(
                  `Root object 'source:retrieve:full' missing in config file '${configfile}' - SKIPPING metadata fixes`
                ); */
            }
          }

          if (this.flags.types.length > 0) {
            this.logger.info('final copy');
            const forceapppath = path.join(projectpath, 'force-app');
            shell.cp('-R', `${orgretrievepath}/force-app/main`, forceapppath);
          }
        } else {
          throw new Error(out.message);
        }
      } catch (error) {
        throw error;
      } finally {
        if (!this.flags.keepcache) {
          await core.fs.remove(orgretrievepath);
        }
      }
    }

    return {
      orgId: this.org.getOrgId()
    };
  }
}
