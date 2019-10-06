import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { serializeError } from 'serialize-error';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');

/* istanbul ignore else*/
if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line: no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export default class ScratchOrgSettings extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:scratchorgsettings
$ sfdx jayree:scratchorgsettings -u me@my.org
$ sfdx jayree:scratchorgsettings -u MyTestOrg1 -w`
  ];

  protected static flagsConfig = {
    writetoprojectscratchdeffile: flags.boolean({
      char: 'w',
      description: messages.getMessage('writetoprojectscratchdeffile')
    }),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const removeEmpty = obj => {
      Object.entries(obj).forEach(
        ([key, val]) =>
          (val && typeof val === 'object' && removeEmpty(val)) || ((val === null || val === '') && delete obj[key])
      );
      return obj;
    };

    const sortKeys = obj => {
      const ordered = {};
      Object.keys(obj)
        .sort()
        .forEach(key => {
          ordered[key] = obj[key];
        });
      return ordered;
    };

    this.ux.startSpinner('Generating settings');
    const conn = this.org.getConnection();

    let settings = {};

    await Promise.all(
      [
        'AccountSettings',
        'ActivitiesSettings',
        // 'AddressSettings',
        'BusinessHoursSettings',
        'CaseSettings',
        'ChatterAnswersSettings',
        'CompanySettings',
        'ContractSettings',
        'EntitlementSettings',
        'FieldServiceSettings',
        'FileUploadAndDownloadSecuritySettings',
        'ForecastingSettings',
        'IdeasSettings',
        'IoTSettings',
        'KnowledgeSettings',
        // 'LeadConvertSettings',
        'LiveAgentSettings',
        'LiveMessageSettings',
        'MacroSettings',
        'MobileSettings',
        'NameSettings',
        'OmniChannelSettings',
        'OpportunitySettings',
        'OrderSettings',
        'OrgPreferenceSettings',
        'PathAssistantSettings',
        'ProductSettings',
        'ProfileSessionSetting',
        'QuoteSettings',
        // 'SearchSettings',
        'SecuritySettings',
        // 'SocialCustomerServiceSettings',
        'Territory2Settings'
      ].map(async member => {
        try {
          const settingsQuery = await conn.tooling.query('SELECT Metadata FROM ' + member);
          if (typeof settingsQuery.records !== 'undefined') {
            for await (const record of settingsQuery.records) {
              if (member === 'OrgPreferenceSettings') {
                settings[camelize(member)] = {};
                record['Metadata']['preferences'].forEach(element => {
                  settings[camelize(member)][camelize(element['settingName'])] = element['settingValue'];
                });
              } else {
                settings[camelize(member)] = record['Metadata'];
              }
            }
          } else {
            this.logger.error('query ' + member + ' not possible');
          }
        } catch (error) {
          if (!['INVALID_TYPE', 'EXTERNAL_OBJECT_EXCEPTION'].includes((error as Error).name)) {
            this.ux.error(error);
          }
        }
      })
    );

    this.ux.stopSpinner();
    // fix hard coded things

    if (settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents']) {
      delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
      this.ux.warn(
        "You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce."
      );
    }

    if (settings['pathAssistantSettings']) {
      delete settings['pathAssistantSettings'];
      this.logger.error(
        'pathAssistantSettings seems to be not supportet, please create an issue on github if you see this message.'
      );
    }

    if (settings['territory2Settings']) {
      delete settings['territory2Settings'];
      this.ux.warn(
        'territory2Settings are not available for deploy during Scratch Org creation, you can deploy territory2Settings afterwards.'
      );
    }

    if (typeof settings['orgPreferenceSettings']['expandedSourceTrackingPref'] !== 'undefined') {
      delete settings['orgPreferenceSettings']['expandedSourceTrackingPref'];
    }

    if (typeof settings['orgPreferenceSettings']['scratchOrgManagementPref'] !== 'undefined') {
      delete settings['orgPreferenceSettings']['scratchOrgManagementPref'];
    }

    if (typeof settings['orgPreferenceSettings']['packaging2'] !== 'undefined') {
      delete settings['orgPreferenceSettings']['packaging2'];
    }

    if (typeof settings['orgPreferenceSettings']['compileOnDeploy'] !== 'undefined') {
      delete settings['orgPreferenceSettings']['compileOnDeploy'];
    }

    if (settings['forecastingSettings']['forecastingCategoryMappings']) {
      delete settings['forecastingSettings']['forecastingCategoryMappings'];
    }

    if (settings['forecastingSettings']['forecastingTypeSettings']) {
      delete settings['forecastingSettings']['forecastingTypeSettings'];
    }

    settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] = 'EmailMessageEvent';
    settings = removeEmpty(settings);
    settings = sortKeys(settings);
    settings['orgPreferenceSettings'] = sortKeys(settings['orgPreferenceSettings']);

    if (this.flags.writetoprojectscratchdeffile) {
      const deffilepath =
        this.flags.file || path.join(await this.project.getPath(), 'config', 'project-scratch-def.json');
      let deffile = {};

      await fs
        .readFile(deffilepath, 'utf8')
        .then(data => {
          deffile = JSON.parse(data);
          deffile['settings'] = settings;
        })
        .catch(err => {
          if (err.code === 'ENOENT' && !this.flags.file) {
            throw Error("default file 'project-scratch-def.json' not found, please use --file flag");
          } else {
            this.throwError(err);
          }
        });

      await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2)).catch(err => {
        this.throwError(err);
      });
    } else {
      this.ux.styledHeader('received settings from Org: ' + this.org.getUsername() + ' (' + this.org.getOrgId() + ')');
      this.ux.styledJSON(settings);
    }

    return {
      settings,
      orgId: this.org.getOrgId(),
      username: this.org.getUsername()
    };
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    this.logger.error({ err: serializeError(err) });
    throw err;
  }
}
