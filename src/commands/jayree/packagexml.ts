import { core, flags, SfdxCommand } from '@salesforce/command';
import * as jf from 'jsonfile';
import * as convert from 'xml-js';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-jayree', 'packagexml');

export {};
declare global {
    interface Array<T> {
      pushUniqueValue(elem: T): T[];
    }
}

if (!Array.prototype.pushUniqueValue) {
  Array.prototype.pushUniqueValue = function<T>(elem: T): T[] {
    if (!this.includes(elem)) {
      this.push(elem);
    }
    return this;
  };
}

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  ((Symbol as any)['asyncIterator']) = Symbol.for('asyncIterator');
}

export default class PackageXML extends SfdxCommand {

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

    let apiVersion;
    let quickFilters;
    let excludeManaged;
    const packageTypes = {};
    const configFile = this.flags.config || false;

    try {
      if (configFile) {
        jf.readFile(configFile, (err, obj) => {
          if (err) {
            throw err;
          } else {
            /* cli parameters still override whats in the config file */
            apiVersion = this.flags.apiversion || obj.apiVersion || '43.0';
            if (this.flags.quickfilter) {
              quickFilters = this.flags.quickfilter.split(',');
            } else {
              quickFilters = obj.quickfilter || [];
            }
            excludeManaged = this.flags.excludeManaged || (obj.excludeManaged === 'true') || false;
          }
        });
      } else {
        apiVersion = this.flags.apiversion || '43.0';
        if (this.flags.quickfilter) {
          quickFilters = this.flags.quickfilter.split(',');
        } else {
          quickFilters = [];
        }
        excludeManaged = this.flags.excludeManaged || false;
      }

      // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
      const conn = this.org.getConnection();
      /*     const query = 'Select Name, TrialExpirationDate from Organization';

          // The type we are querying for
          interface Organization {
            Name: string;
            TrialExpirationDate: string;
          }

          // Query the org
          const result = await conn.query<Organization>(query);
          */

      const describe = await conn.metadata.describe(apiVersion);

      const folders = [];
      const unfolderedObjects = [];
      for await (const object of describe.metadataObjects) {
        if (object.inFolder) {
          const objectType = object.xmlName.replace('Template', '');
          const promise = conn.metadata.list({
            type: `${objectType}Folder`
          }, apiVersion);
          folders.push(promise);
        } else {
          const promise = conn.metadata.list({
            type: object.xmlName
          }, apiVersion);
          unfolderedObjects.push(promise);
        }
      }

      const folderedObjects = [];
      for await (const folder of folders) {
        let folderItems = [];
        if (Array.isArray(folder)) {
          folderItems = folder;
        } else if (folder) {
          folderItems = [folder];
        }
        if (folderItems.length > 0) {
          for await (const folderItem of folderItems) {
            let objectType = folderItem.type.replace('Folder', '');
            if (objectType === 'Email') {
              objectType += 'Template';
            }
            const promise = conn.metadata.list({
              type: objectType,
              folder: folderItem.fullName
            }, apiVersion);
            folderedObjects.push(promise);
          }
        }
      }

      const flowDefinitionQuery = await conn.tooling.query('SELECT DeveloperName,ActiveVersion.VersionNumber FROM FlowDefinition');

      const activeFlowVersions = [];
      for await (const record of flowDefinitionQuery.records) {
        if (record['ActiveVersion']) {
          if (!activeFlowVersions[record['DeveloperName']]) {
            activeFlowVersions[record['DeveloperName']] = [];
          }
          activeFlowVersions[record['DeveloperName']].pushUniqueValue(record['ActiveVersion']['VersionNumber']);
        }
      }

      // this.ux.log(activeFlowVersions);
      // this.ux.log(await Promise.all(folderedObjects));
      // this.ux.log(await Promise.all(unfolderedObjects));

      (await Promise.all(unfolderedObjects)).forEach(unfolderedObject => {
        try {
          if (unfolderedObject) {
            let unfolderedObjectItems = [];
            if (Array.isArray(unfolderedObject)) {
              unfolderedObjectItems = unfolderedObject;
            } else {
              unfolderedObjectItems = [unfolderedObject];
            }
            unfolderedObjectItems.forEach(metadataEntries => {

              if (metadataEntries) {

                if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {

                  if (metadataEntries.fileName.includes('ValueSetTranslation')) {
                    const x = metadataEntries.fileName.split('.')[1].substring(0, 1).toUpperCase() + metadataEntries.fileName.split('.')[1].substring(1);
                    if (!packageTypes[x]) {
                      packageTypes[x] = [];
                    }
                    packageTypes[x].pushUniqueValue(metadataEntries.fullName);
                  } else {

                    if (!packageTypes[metadataEntries.type]) {
                      packageTypes[metadataEntries.type] = [];
                    }

                    if (metadataEntries.type === 'Flow') {

                      if (activeFlowVersions[metadataEntries.fullName]) {
                        packageTypes[metadataEntries.type].pushUniqueValue(`${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName]}`);
                      } else {
                        packageTypes[metadataEntries.type].pushUniqueValue(metadataEntries.fullName);
                      }

                    } else {
                      packageTypes[metadataEntries.type].pushUniqueValue(metadataEntries.fullName);
                    }

                  }
                }
              } else {
                console.error('No metadataEntry available');
              }
            });
          }
        } catch (err) {
          console.error(err);
        }
      });

      (await Promise.all(folderedObjects)).forEach(folderedObject => {
        try {

          if (folderedObject) {
            let folderedObjectItems = [];
            if (Array.isArray(folderedObject)) {
              folderedObjectItems = folderedObject;
            } else {
              folderedObjectItems = [folderedObject];
            }
            folderedObjectItems.forEach(metadataEntries => {
              if (metadataEntries) {
                if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {

                  if (!packageTypes[metadataEntries.type]) {
                    packageTypes[metadataEntries.type] = [];
                  }
                  packageTypes[metadataEntries.type].pushUniqueValue(metadataEntries.fullName);
                }
              } else {
                console.error('No metadataEntry available');
              }
            });
          }
        } catch (err) {
          console.error(err);
        }
      });

      if (!packageTypes['StandardValueSet']) {
        packageTypes['StandardValueSet'] = [];
      }
      ['AccountContactMultiRoles', 'AccountContactRole', 'AccountOwnership', 'AccountRating', 'AccountType', 'AddressCountryCode', 'AddressStateCode', 'AssetStatus', 'CampaignMemberStatus', 'CampaignStatus', 'CampaignType', 'CaseContactRole', 'CaseOrigin', 'CasePriority', 'CaseReason', 'CaseStatus', 'CaseType', 'ContactRole', 'ContractContactRole', 'ContractStatus', 'EntitlementType', 'EventSubject', 'EventType', 'FiscalYearPeriodName', 'FiscalYearPeriodPrefix', 'FiscalYearQuarterName', 'FiscalYearQuarterPrefix', 'IdeaCategory', 'IdeaMultiCategory', 'IdeaStatus', 'IdeaThemeStatus', 'Industry', 'InvoiceStatus', 'LeadSource', 'LeadStatus', 'OpportunityCompetitor', 'OpportunityStage', 'OpportunityType', 'OrderStatus', 'OrderType', 'PartnerRole', 'Product2Family', 'QuestionOrigin', 'QuickTextCategory', 'QuickTextChannel', 'QuoteStatus', 'SalesTeamRole', 'Salutation', 'ServiceContractApprovalStatus', 'SocialPostClassification', 'SocialPostEngagementLevel', 'SocialPostReviewedStatus', 'SolutionStatus', 'TaskPriority', 'TaskStatus', 'TaskSubject', 'TaskType', 'WorkOrderLineItemStatus', 'WorkOrderPriority', 'WorkOrderStatus'].forEach(member => {
        packageTypes['StandardValueSet'].pushUniqueValue(member);
      });

      /*       const packageJson = {
              types: [],
              version: apiVersion
            };

            Object.keys(packageTypes).forEach(type => {
              if ((quickFilters.length === 0 || quickFilters.includes(type))) {
                packageJson.types.push({
                  name: type,
                  members: packageTypes[type]
                });
              }
            }); */

      const packageJson = {
        _declaration: {_attributes: {version: '1.0', encoding: 'utf-8'}},
        Package: [{
          _attributes: {xmlns: 'http://soap.sforce.com/2006/04/metadata'},
          types: [],
          version: apiVersion
        }]
      };

      Object.keys(packageTypes).forEach(mdtype => {
        if ((quickFilters.length === 0 || quickFilters.includes(mdtype))) {
          packageJson.Package[0].types.push({
            name: mdtype,
            members: packageTypes[mdtype]
          });
        }
      });

      // const packageXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n${convert.js2xml(packageJson, { compact: true, spaces: 4 })}\n</Package>`;
      const packageXml = convert.js2xml(packageJson, { compact: true, spaces: 4 });

      this.ux.log(packageXml);

      /*     // Organization will always return one result, but this is an example of throwing an error
          // The output and --json will automatically be handled for you.
          if (!result.records || result.records.length <= 0) {
            throw new core.SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]));
          }

          // Organization always only returns one result
          const orgName = result.records[0].Name;
          const trialExpirationDate = result.records[0].TrialExpirationDate;

          let outputString = `Hello ${name}! This is org: ${orgName}`;
          if (trialExpirationDate) {
            const date = new Date(trialExpirationDate).toDateString();
            outputString = `${outputString} and I will be around until ${date}!`;
          }
           this.ux.log(outputString);

          // this.hubOrg is NOT guaranteed because supportsHubOrgUsername=true, as opposed to requiresHubOrgUsername.
          if (this.hubOrg) {
            const hubOrgId = this.hubOrg.getOrgId();
            this.ux.log(`My hub org id is: ${hubOrgId}`);
          }

          if (this.flags.force && this.args.file) {
            this.ux.log(`You input --force and --file: ${this.args.file}`);
          } */

      // Return an object to be displayed with --json
      return { orgId: this.org.getOrgId(), packageJson };
    } catch (err) {
      console.error(err);
    }
  }
}
