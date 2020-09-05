/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import chalk from 'chalk';
import createDebug from 'debug';
import * as fs from 'fs-extra';
import { serializeError } from 'serialize-error';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export default class ScratchOrgSettings extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');
  public static hidden = true;
  public static examples = [
    `$ sfdx jayree:scratchorgsettings
$ sfdx jayree:scratchorgsettings -u me@my.org
$ sfdx jayree:scratchorgsettings -u MyTestOrg1 -w`,
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

    this.ux.startSpinner('Generating settings');
    const conn = this.org.getConnection();
    debug(conn.getApiVersion());

    const settingsarray = (await conn.tooling.describeGlobal()).sobjects
      .filter((a) => a.name.includes('Settings'))
      .map((a) => a.name);

    let settings = {};

    for await (const member of settingsarray) {
      try {
        const settingsQuery = await conn.tooling.query('SELECT Metadata FROM ' + member);
        if (typeof settingsQuery.records !== 'undefined') {
          for await (const record of settingsQuery.records) {
            if (member === 'OrgPreferenceSettings') {
              settings[camelize(member)] = {};
              record['Metadata']['preferences'].forEach((element) => {
                settings[camelize(member)][camelize(element['settingName'])] = element['settingValue'];
              });
            } else {
              settings[camelize(member)] = record['Metadata'];
            }
          }
        } else {
          this.logger.error('query ' + member + ' not possible');
          // debug('query ' + member + ' not possible');
          debug(chalk.red('Error: ' + member + ' - ' + (settingsQuery as any)));
        }
      } catch (error) {
        if (
          !['INVALID_TYPE', 'EXTERNAL_OBJECT_EXCEPTION', 'INVALID_FIELD', 'UNKNOWN_EXCEPTION'].includes(
            (error as Error).name
          )
        ) {
          this.ux.error(error as Error);
        } else {
          const e = (error as Error).message.split('\n');
          if (e[e.length - 1].includes('Metadata')) {
            debug(chalk.gray('Warning: ' + member + ' - ' + e[e.length - 1]));
          } else if (e[e.length - 1].includes('Cannot access')) {
            debug(chalk.yellow('Error: ' + member + ' - ' + e[e.length - 1]));
          } else {
            debug(chalk.red('Error: ' + member + ' - ' + e[e.length - 1]));
          }
        }
      }
    }

    this.ux.stopSpinner();
    // fix hard coded things

    if (typeof settings['addressSettings'] !== 'undefined') {
      delete settings['addressSettings'];
      debug('delete ' + 'addressSettings');
    }

    if (typeof settings['leadConvertSettings'] !== 'undefined') {
      delete settings['leadConvertSettings'];
      debug('delete ' + 'leadConvertSettings');
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
      if (typeof settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'] !== 'undefined') {
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

    if (typeof settings['orgPreferenceSettings'] !== 'undefined') {
      if (typeof settings['orgPreferenceSettings']['expandedSourceTrackingPref'] !== 'undefined') {
        delete settings['orgPreferenceSettings']['expandedSourceTrackingPref'];
        debug('delete ' + 'orgPreferenceSettings:expandedSourceTrackingPref');
      }

      if (typeof settings['orgPreferenceSettings']['scratchOrgManagementPref'] !== 'undefined') {
        delete settings['orgPreferenceSettings']['scratchOrgManagementPref'];
        debug('delete ' + 'orgPreferenceSettings:scratchOrgManagementPref');
      }

      if (typeof settings['orgPreferenceSettings']['packaging2'] !== 'undefined') {
        delete settings['orgPreferenceSettings']['packaging2'];
        debug('delete ' + 'orgPreferenceSettings:packaging2');
      }

      if (typeof settings['orgPreferenceSettings']['compileOnDeploy'] !== 'undefined') {
        delete settings['orgPreferenceSettings']['compileOnDeploy'];
        debug('delete ' + 'orgPreferenceSettings:compileOnDeploy');
      }
    }

    if (typeof settings['apexSettings']['enableCompileOnDeploy'] !== 'undefined') {
      delete settings['apexSettings']['enableCompileOnDeploy'];
      debug('delete ' + 'apexSettings:enableCompileOnDeploy');
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

    if (typeof settings['orgPreferenceSettings'] !== 'undefined') {
      settings['orgPreferenceSettings'] = sortKeys(settings['orgPreferenceSettings']);
    }

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
                  if (settings['liveAgentSettings']['enableLiveAgent'] === false) {
                    delete settings['liveAgentSettings'];
                    debug('delete ' + 'liveAgentSettings');
                    this.ux.warn('liveAgentSettings: Not available for deploy for this organization');
                  }
                }
              }
            }

            if (typeof settings['knowledgeSettings'] !== 'undefined') {
              if (typeof settings['knowledgeSettings']['enableKnowledge'] !== 'undefined') {
                if (settings['knowledgeSettings']['enableKnowledge'] === false) {
                  delete settings['knowledgeSettings'];
                  debug('delete ' + 'knowledgeSettings');
                  this.ux.warn("knowledgeSettings: Once enabled, Salesforce Knowledge can't be disabled.");
                }
              }
            }

            if (typeof settings['caseSettings'] !== 'undefined') {
              if (typeof settings['caseSettings']['emailToCase'] !== 'undefined') {
                if (typeof settings['caseSettings']['emailToCase']['enableEmailToCase'] !== 'undefined') {
                  if (settings['caseSettings']['emailToCase']['enableEmailToCase'] === false) {
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
      this.ux.styledHeader('received settings from Org: ' + this.org.getUsername() + ' (' + this.org.getOrgId() + ')');
      this.ux.styledJSON(settings);
    }

    return {
      settings,
      orgId: this.org.getOrgId(),
      username: this.org.getUsername(),
    };
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    this.logger.error({ err: serializeError(err) });
    throw err;
  }
}
