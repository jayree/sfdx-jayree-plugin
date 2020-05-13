import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as AdmZip from 'adm-zip';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefull');

export default class RetrieveProfiles extends SourceRetrieveBase {
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
    metadata: flags.array({
      char: 'm',
      description: messages.getMessage('metadata'),
      options: ['Profile', 'PermissionSet', 'CustomLabels'],
      default: ['Profile', 'PermissionSet', 'CustomLabels']
    }),
    verbose: flags.builtin({
      description: messages.getMessage('log'),
      longDescription: messages.getMessage('log')
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
    let inboundFiles = [];

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
          `sfdx force:mdapi:retrieve --retrievetargetdir=${orgretrievepath} --unpackaged=${path.join(
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
          { fatal: false, silent: true, env: { ...process.env, FORCE_COLOR: 0 } }
        )
      );

      if (out.success) {
        const zip = new AdmZip(out.zipFilePath);
        zip.extractAllTo(orgretrievepath);

        if (this.flags.metadata.includes('Profile')) {
          out = json(
            shell.exec(
              `sfdx force:mdapi:convert --metadata=Profile --outputdir=${path.join(
                orgretrievepath,
                'src'
              )} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`,
              {
                fatal: false,
                silent: true,
                env: { ...process.env, FORCE_COLOR: 0 }
              }
            )
          );
          if (!out.length) {
            throw out;
          } else {
            out
              .map(p => {
                return {
                  fullName: p.fullName,
                  type: p.type,
                  filePath: path
                    .relative(orgretrievepath, p.filePath)
                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                  state: 'undefined'
                };
              })
              .forEach(element => {
                inboundFiles.push(element);
              });
          }
        }

        if (this.flags.metadata.includes('PermissionSet')) {
          out = json(
            shell.exec(
              `sfdx force:mdapi:convert --metadata=PermissionSet --outputdir=${path.join(
                orgretrievepath,
                'src'
              )} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`,
              {
                fatal: false,
                silent: true,
                env: { ...process.env, FORCE_COLOR: 0 }
              }
            )
          );
          if (!out.length) {
            throw out;
          } else {
            out
              .map(p => {
                return {
                  fullName: p.fullName,
                  type: p.type,
                  filePath: path
                    .relative(orgretrievepath, p.filePath)
                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                  state: 'undefined'
                };
              })
              .forEach(element => {
                inboundFiles.push(element);
              });
          }
        }

        if (this.flags.metadata.includes('CustomLabels')) {
          out = json(
            shell.exec(
              `sfdx force:mdapi:convert --metadata=CustomLabels --outputdir=${path.join(
                orgretrievepath,
                'src'
              )} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`,
              {
                fatal: false,
                silent: true,
                env: { ...process.env, FORCE_COLOR: 0 }
              }
            )
          );
          if (!out.length) {
            throw out;
          } else {
            out
              .map(p => {
                return {
                  fullName: p.fullName,
                  type: p.type,
                  filePath: path
                    .relative(orgretrievepath, p.filePath)
                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                  state: 'undefined'
                };
              })
              .forEach(element => {
                inboundFiles.push(element);
              });
          }
        }

        shell.mv(path.join(orgretrievepath, 'src'), path.join(orgretrievepath, 'force-app'));
        await this.profileElementInjection(orgretrievepath);

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
                    this.log("'" + workaround + "'");
                    if (config[workarounds][workaround].files.delete) {
                      await this.sourcedelete(config[workarounds][workaround].files.delete, orgretrievepath);
                    }
                    if (config[workarounds][workaround].files.modify) {
                      await this.sourcefix(
                        config[workarounds][workaround].files.modify,
                        orgretrievepath,
                        this.org.getConnection()
                      );
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

        const cleanedfiles = shell
          .find(path.join(orgretrievepath, 'force-app'))
          .filter(file => {
            return fs.lstatSync(file).isFile();
          })
          .map(file => path.relative(orgretrievepath, file));

        inboundFiles = inboundFiles.filter(x => {
          if (cleanedfiles.includes(x.filePath)) {
            return x;
          }
        });

        if (this.flags.metadata.length > 0) {
          const forceapppath = path.join(projectpath, 'force-app');
          shell.cp('-R', path.join(orgretrievepath, 'force-app/main'), forceapppath);
        }
      } else {
        throw out;
      }
    } catch (error) {
      throw error;
    } finally {
      if (!this.flags.keepcache) {
        await core.fs.remove(orgretrievepath);
      }

      this.ux.styledHeader(chalk.blue('Retrieved Source'));
      this.ux.table(inboundFiles, {
        columns: [
          {
            key: 'fullName',
            label: 'FULL NAME'
          },
          {
            key: 'type',
            label: 'TYPE'
          },
          {
            key: 'filePath',
            label: 'PROJECT PATH'
          }
        ]
      });
    }

    return {
      inboundFiles
    };
  }
}
