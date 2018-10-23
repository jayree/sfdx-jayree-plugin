import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as jf from 'jsonfile';
import * as notifier from 'node-notifier';
import * as convert from 'xml-js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'packagexml');

declare global {
  interface Array<T> {
    pushUniqueValue(elem: T): T[];
  }
  interface String {
    toLowerCaseifTrue(ignore: boolean): string;
  }
}

if (!Array.prototype.pushUniqueValue) {
  Array.prototype.pushUniqueValue = function <T>(elem: T): T[] {
    if (!this.includes(elem)) {
      this.push(elem);
    }
    return this;
  };
}

if (!String.prototype.toLowerCaseifTrue) {
  String.prototype.toLowerCaseifTrue = function(ignore: boolean) {
    return ignore ? this.toLowerCase() : this;
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

  protected static flagsConfig = {
    config: flags.string({ description: messages.getMessage('configFlagDescription') }),
    quickfilter: flags.string({ char: 'q', description: messages.getMessage('quickfilterFlagDescription') }),
    matchcase: flags.boolean({ char: 'c', description: messages.getMessage('matchCaseFlagDescription') }),
    matchwholeword: flags.boolean({ char: 'w', description: messages.getMessage('matchWholeWordFlagDescription') }),
    excludemanaged: flags.boolean({ char: 'x', description: messages.getMessage('excludeManagedFlagDescription') })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    const packageTypes = {};
    const configFile = this.flags.config || false;

    // try {
    let apiVersion = this.flags.apiversion || await this.org.retrieveMaxApiVersion();
    let quickFilters = this.flags.quickfilter ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',') : [];
    let excludeManaged = this.flags.excludeManaged || false;

    if (configFile) {
      jf.readFile(configFile, (err, obj) => {
        if (err) {
          throw err;
        } else {
          /* cli parameters still override whats in the config file */
          apiVersion = this.flags.apiversion || obj.apiVersion || apiVersion;
          quickFilters = this.flags.quickfilter ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',') : obj.quickfilter || [];
          excludeManaged = this.flags.excludeManaged || (obj.excludeManaged === 'true') || false;
        }
      });
    }

    const conn = this.org.getConnection();
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
        let promise = conn.metadata.list({
          type: object.xmlName
        }, apiVersion);
        unfolderedObjects.push(promise);
        if (Array.isArray(object.childXmlNames)) {
          for (const childXmlNames of object.childXmlNames) {
            promise = conn.metadata.list({
              type: childXmlNames
            }, apiVersion);
            unfolderedObjects.push(promise);
          }
        }
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

    const flowDefinitionQuery = await conn.tooling.query('SELECT DeveloperName,ActiveVersion.VersionNumber,LatestVersion.VersionNumber FROM FlowDefinition');
    const activeFlowVersions = {};
    for await (const record of flowDefinitionQuery.records) {
      if (record['ActiveVersion'] && record['LatestVersion']) {
        if (!activeFlowVersions[record['DeveloperName']]) {
          activeFlowVersions[record['DeveloperName']] = [];
        }
        activeFlowVersions[record['DeveloperName']] = { ActiveVersion: record['ActiveVersion']['VersionNumber'], LatestVersion: record['LatestVersion']['VersionNumber'] };
      }
    }

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
                  packageTypes[x].pushUniqueValue({ fullName: metadataEntries.fullName, fileName: metadataEntries.fileName });
                } else {

                  if (!packageTypes[metadataEntries.type]) {
                    packageTypes[metadataEntries.type] = [];
                  }

                  if (metadataEntries.type === 'Flow' && activeFlowVersions[metadataEntries.fullName]) {

                    if (apiVersion >= 44.0) {
                      if (activeFlowVersions[metadataEntries.fullName].ActiveVersion !== activeFlowVersions[metadataEntries.fullName].LatestVersion) {
                        // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`);
                        packageTypes[metadataEntries.type].pushUniqueValue({ fullName: metadataEntries.fullName, fileName: metadataEntries.fileName, warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!` });
                      } else {
                        packageTypes[metadataEntries.type].pushUniqueValue({ fullName: metadataEntries.fullName, fileName: metadataEntries.fileName });
                      }
                    } else {
                      packageTypes[metadataEntries.type].pushUniqueValue({ fullName: `${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}`, fileName: metadataEntries.fileName, warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'` });
                      // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`);
                    }
                  } else {
                    packageTypes[metadataEntries.type].pushUniqueValue({ fullName: metadataEntries.fullName, fileName: metadataEntries.fileName });
                  }

                }
              }
            } else {
              this.ux.error('No metadataEntry available');
            }
          });
        }
      } catch (err) {
        this.ux.error(err);
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
                packageTypes[metadataEntries.type].pushUniqueValue({ fullName: metadataEntries.fullName, fileName: metadataEntries.fileName });
              }
            } else {
              this.ux.error('No metadataEntry available');
            }
          });
        }
      } catch (err) {
        this.ux.error(err);
      }
    });

    if (!packageTypes['StandardValueSet']) {
      packageTypes['StandardValueSet'] = [];
    }
    ['AccountContactMultiRoles', 'AccountContactRole', 'AccountOwnership', 'AccountRating', 'AccountType', 'AddressCountryCode', 'AddressStateCode', 'AssetStatus', 'CampaignMemberStatus', 'CampaignStatus', 'CampaignType', 'CaseContactRole', 'CaseOrigin', 'CasePriority', 'CaseReason', 'CaseStatus', 'CaseType', 'ContactRole', 'ContractContactRole', 'ContractStatus', 'EntitlementType', 'EventSubject', 'EventType', 'FiscalYearPeriodName', 'FiscalYearPeriodPrefix', 'FiscalYearQuarterName', 'FiscalYearQuarterPrefix', 'IdeaCategory', 'IdeaMultiCategory', 'IdeaStatus', 'IdeaThemeStatus', 'Industry', 'InvoiceStatus', 'LeadSource', 'LeadStatus', 'OpportunityCompetitor', 'OpportunityStage', 'OpportunityType', 'OrderStatus', 'OrderType', 'PartnerRole', 'Product2Family', 'QuestionOrigin', 'QuickTextCategory', 'QuickTextChannel', 'QuoteStatus', 'SalesTeamRole', 'Salutation', 'ServiceContractApprovalStatus', 'SocialPostClassification', 'SocialPostEngagementLevel', 'SocialPostReviewedStatus', 'SolutionStatus', 'TaskPriority', 'TaskStatus', 'TaskSubject', 'TaskType', 'WorkOrderLineItemStatus', 'WorkOrderPriority', 'WorkOrderStatus'].forEach(member => {
      packageTypes['StandardValueSet'].pushUniqueValue({ fullName: member, fileName: `${member}.standardValueSet` });
    });

    const packageJson = {
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
      Package: [{
        _attributes: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
        types: [],
        version: apiVersion
      }]
    };

    const filteredwarnings = [];
    Object.keys(packageTypes).forEach(mdtype => {

      const fileFilters = (quickFilters.length > 0) ? packageTypes[mdtype]
        .map(value => value.fileName.toLowerCaseifTrue(!this.flags.matchcase))
        .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
        .filter((value, index, self) => self.indexOf(value) === index) : [];

      const mdFilters = (quickFilters.length > 0) ? [mdtype.toLowerCaseifTrue(!this.flags.matchcase)]
        .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
        .filter((value, index, self) => self.indexOf(value) === index) : [];

      const mFilters = (quickFilters.length > 0) ? packageTypes[mdtype]
        .map(value => value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
        .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
        .filter((value, index, self) => self.indexOf(value) === index) : [];

      if (quickFilters.length === 0 || mdFilters.length > 0 || fileFilters.length > 0 || mFilters.length > 0) {

        packageJson.Package[0].types.push({
          name: mdtype,
          members: packageTypes[mdtype]
            .filter(value => quickFilters.length === 0 || mdFilters.includes(mdtype.toLowerCaseifTrue(!this.flags.matchcase)) || fileFilters.includes(value.fileName.toLowerCaseifTrue(!this.flags.matchcase)) || mFilters.includes(value.fullName.toLowerCaseifTrue(!this.flags.matchcase)))
            .map(value => {
              if (value.warning) { filteredwarnings.push(value.warning); }
              return value.fullName;
            })
        });

      }
    });

    const packageXml = convert.js2xml(packageJson, { compact: true, spaces: 4 });

    notifier.notify({
      title: 'sfdx-jayree packagexml',
      message: 'Finished creating pakckage.xml for: ' + this.org.getUsername()
    });

    filteredwarnings.forEach(value => this.ux.warn(value));
    this.ux.log(packageXml);

    return { orgId: this.org.getOrgId(), packagexml: packageJson, warnings: filteredwarnings};
    // } catch (err) {
    //   this.ux.error(err);
    // }
  }
}
