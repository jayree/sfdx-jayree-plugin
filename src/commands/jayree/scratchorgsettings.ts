import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import serializeError = require('serialize-error');

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');

/* istanbul ignore else*/
if (Symbol['asyncIterator'] === undefined) {
  (Symbol as AsyncIterableIterator<{}>)['asyncIterator'] = Symbol.for('asyncIterator');
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
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    this.ux.startSpinner('Generating settings');
    await this.org.refreshAuth();
    const conn = this.org.getConnection();

    const settings = {};

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
        } catch (error) {
          if (!['INVALID_TYPE', 'EXTERNAL_OBJECT_EXCEPTION'].includes((error as Error).name)) {
            this.ux.error(error);
          }
        }
      })
    );

    const removeEmpty = obj => {
      Object.entries(obj).forEach(
        ([key, val]) =>
          (val && typeof val === 'object' && removeEmpty(val)) || ((val === null || val === '') && delete obj[key])
      );
      return obj;
    };

    this.ux.stopSpinner();
    // fix hard coded things

    if (settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents']) {
      delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
      this.ux.warn(
        "You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce."
      );
    }

    if (settings['forecastingSettings']['forecastingCategoryMappings']) {
      delete settings['forecastingSettings']['forecastingCategoryMappings'];
    }

    if (settings['forecastingSettings']['forecastingTypeSettings']) {
      delete settings['forecastingSettings']['forecastingTypeSettings'];
    }

    settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] = 'EmailMessageEvent';

    if (this.flags.writetoprojectscratchdeffile) {
      const deffilepath = path.join(await this.project.getPath(), 'config', 'project-scratch-def.json');
      let deffile = {};

      await fs
        .readFile(deffilepath, 'utf8')
        .then(data => {
          deffile = JSON.parse(data);
          deffile['settings'] = removeEmpty(settings);
        })
        .catch(err => {
          this.throwError(err);
        });

      await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2)).catch(err => {
        this.throwError(err);
      });
    } else {
      this.ux.styledHeader('received settings from Org: ' + this.org.getUsername() + ' (' + this.org.getOrgId() + ')');
      this.ux.styledJSON(removeEmpty(settings));
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
