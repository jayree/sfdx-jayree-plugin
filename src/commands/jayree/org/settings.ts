/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import createDebug from 'debug';
import * as fs from 'fs-extra';
import execa from 'execa';
import { parseStringSync } from '../../../utils/xml';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export default class ScratchOrgSettings extends JayreeSfdxCommand {
  public static aliases = ['jayree:scratchorg:settings'];

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:org:settings
$ sfdx jayree:org:settings -u me@my.org
$ sfdx jayree:org:settings -u MyTestOrg1 -w`,
  ];

  protected static flagsConfig = {
    writetoprojectscratchdeffile: flags.boolean({
      char: 'w',
      description: messages.getMessage('writetoprojectscratchdeffile'),
    }),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  // eslint-disable-next-line complexity
  public async run(): Promise<AnyJson> {
    this.warnIfRunByAlias(ScratchOrgSettings);
    const debug = createDebug('jayree:scratchorg:settings');
    const removeEmpty = (obj) => {
      Object.entries(obj).forEach(([key, val]) => {
        if (val && typeof val === 'object') {
          val = removeEmpty(val);
        }
        if (val === null || val === '' || (typeof val === 'object' && !Object.keys(val).length)) {
          delete obj[key];
        }
      });
      return obj;
    };

    const sortKeys = (obj) => {
      const ordered = {};
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          ordered[key] = obj[key];
        });
      return ordered;
    };

    const projectpath = this.project.getPath();

    let settings = {};

    const orgretrievepath = path.join(
      projectpath,
      '.sfdx-jayree',
      'orgs',
      this.org.getUsername(),
      `sdx_retrieveSettings_${Date.now()}`
    );

    // this.ux.startSpinner('Generating settings');

    try {
      await core.fs.mkdirp(orgretrievepath, core.fs.DEFAULT_USER_DIR_MODE);

      await execa('sfdx', ['force:project:create', '--projectname', '.', '--json'], {
        cwd: orgretrievepath,
        env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' },
      });

      let sfdxProjectVersion;
      /* istanbul ignore next*/
      try {
        const sfdxProject = await core.SfdxProject.resolve();
        const sfdxProjectJson = await sfdxProject.retrieveSfdxProjectJson();
        sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
        // eslint-disable-next-line no-empty
      } catch (error) {}

      const apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());

      this.ux.log(`Using ${orgretrievepath} and apiVersion=${apiVersion}`);

      const out = JSON.parse(
        (
          await execa(
            'sfdx',
            [
              'force:source:retrieve',
              '--manifest',
              path.join(__dirname, '..', '..', '..', '..', '..', 'manifest', 'package-settings.xml'),
              '--targetusername',
              this.org.getUsername(),
              '--apiversion',
              apiVersion,
              '--json',
            ],
            { cwd: orgretrievepath, env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' } }
          )
        ).stdout
      );

      if (out?.result?.warnings) {
        out.result.warnings.forEach((warning) => {
          this.ux.warn(warning.problem);
        });
      }

      if (out?.result?.inboundFiles) {
        out.result.inboundFiles.forEach((element) => {
          const filename = path.join(orgretrievepath, element.filePath);
          const settingsXml = parseStringSync(fs.readFileSync(filename, 'utf8'), false);
          Object.keys(settingsXml).forEach((key) => {
            Object.keys(settingsXml[key]).forEach((property) => {
              if (!settings[camelize(key)]) {
                settings[camelize(key)] = {};
              }
              if (property !== '$') {
                settings[camelize(key)][property] = settingsXml[key][property];
              }
            });
          });
        });
      } else {
        throw out;
      }
      if (typeof settings['addressSettings'] !== 'undefined') {
        delete settings['addressSettings'];
        debug('delete ' + 'addressSettings');
      }

      if (typeof settings['searchSettings'] !== 'undefined') {
        delete settings['searchSettings'];
        debug('delete ' + 'searchSettings');
      }

      if (typeof settings['analyticsSettings'] !== 'undefined') {
        delete settings['analyticsSettings'];
        debug('delete ' + 'analyticsSettings');
      }

      if (typeof settings['activitiesSettings'] !== 'undefined') {
        if (
          typeof settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'] !== 'undefined'
        ) {
          delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
          debug('delete ' + 'activitiesSettings:allowUsersToRelateMultipleContactsToTasksAndEvents');

          this.ux.warn(
            "You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce."
          );
        }
      }

      if (typeof settings['territory2Settings'] !== 'undefined') {
        if (typeof settings['territory2Settings']['enableTerritoryManagement2'] !== 'undefined') {
          settings['territory2Settings'] = {
            enableTerritoryManagement2: settings['territory2Settings']['enableTerritoryManagement2'],
          };
          debug('set ' + 'enableTerritoryManagement2');
        }
      }

      if (typeof settings['forecastingSettings'] !== 'undefined') {
        if (typeof settings['forecastingSettings']['forecastingCategoryMappings'] !== 'undefined') {
          delete settings['forecastingSettings']['forecastingCategoryMappings'];
          debug('delete ' + 'forecastingSettings:forecastingCategoryMappings');
        }
        if (typeof settings['forecastingSettings']['forecastingTypeSettings'] !== 'undefined') {
          delete settings['forecastingSettings']['forecastingTypeSettings'];
          debug('delete ' + 'forecastingSettings:forecastingTypeSettings');
        }
      }

      if (typeof settings['caseSettings'] !== 'undefined') {
        if (typeof settings['caseSettings']['caseFeedItemSettings'] !== 'undefined') {
          if (typeof settings['caseSettings']['caseFeedItemSettings'][0] !== 'undefined') {
            if (typeof settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] !== 'undefined') {
              if (settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] === 'EMAIL_MESSAGE_EVENT') {
                settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] = 'EmailMessageEvent';
                debug('set ' + 'caseSettings:caseFeedItemSettings:feedItemType');
              }
            }
          }
        }
      }

      settings = removeEmpty(settings);
      settings = sortKeys(settings);

      if (this.flags.writetoprojectscratchdeffile) {
        const deffilepath =
          // eslint-disable-next-line @typescript-eslint/await-thenable
          this.flags.file || path.join(await this.project.getPath(), 'config', 'project-scratch-def.json');
        let deffile = {};

        await fs
          .readFile(deffilepath, 'utf8')
          .then((data) => {
            deffile = JSON.parse(data);

            if (deffile['edition'] === 'Enterprise') {
              if (!deffile['features'].includes('LiveAgent')) {
                if (typeof settings['liveAgentSettings'] !== 'undefined') {
                  if (typeof settings['liveAgentSettings']['enableLiveAgent'] !== 'undefined') {
                    if (settings['liveAgentSettings']['enableLiveAgent'] === 'false') {
                      delete settings['liveAgentSettings'];
                      debug('delete ' + 'liveAgentSettings');
                      this.ux.warn('liveAgentSettings: Not available for deploy for this organization');
                    }
                  }
                }
              }

              if (typeof settings['knowledgeSettings'] !== 'undefined') {
                if (typeof settings['knowledgeSettings']['enableKnowledge'] !== 'undefined') {
                  if (settings['knowledgeSettings']['enableKnowledge'] === 'false') {
                    delete settings['knowledgeSettings'];
                    debug('delete ' + 'knowledgeSettings');
                    this.ux.warn("knowledgeSettings: Once enabled, Salesforce Knowledge can't be disabled.");
                  }
                }
              }

              if (typeof settings['caseSettings'] !== 'undefined') {
                if (typeof settings['caseSettings']['emailToCase'] !== 'undefined') {
                  if (typeof settings['caseSettings']['emailToCase']['enableEmailToCase'] !== 'undefined') {
                    if (settings['caseSettings']['emailToCase']['enableEmailToCase'] === 'false') {
                      delete settings['caseSettings']['emailToCase'];
                      debug('delete ' + 'caseSettings:emailToCase');
                      this.ux.warn('EmailToCaseSettings: Email to case cannot be disabled once it has been enabled.');
                    }
                  }
                }
              }
            }

            deffile['settings'] = settings;
          })
          .catch((err) => {
            if (err.code === 'ENOENT' && !this.flags.file) {
              throw Error("default file 'project-scratch-def.json' not found, please use --file flag");
            } else {
              this.throwError(err);
            }
          });

        await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2)).catch((err) => {
          this.throwError(err);
        });
      } else {
        this.ux.styledHeader(
          'received settings from Org: ' + this.org.getUsername() + ' (' + this.org.getOrgId() + ')'
        );
        this.ux.styledJSON(settings);
      }

      return {
        settings,
        orgId: this.org.getOrgId(),
        username: this.org.getUsername(),
      };
    } catch (error) {
      if (error.stdout) {
        throw new Error(JSON.parse(error.stdout).message);
      } else {
        throw new Error(error.message.toLowerCase());
      }
    } finally {
      if (!this.flags.keepcache) {
        process.once('exit', () => {
          fs.removeSync(orgretrievepath);
        });
      }
    }
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    throw err;
  }
}
