import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as jsforce from 'jsforce';
import serializeError = require('serialize-error');
// import * as notifier from 'node-notifier';
// import * as convert from 'xml-js';
import * as xml2js from 'xml2js';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'packagexml');

declare global {
  interface Array<T> {
    pushUniqueValueKey(elem: T, key: string): T[];
    pushUniqueValue(elem: T): T[];
  }
  interface String {
    toLowerCaseifTrue(ignore: boolean): string;
  }
}

/* istanbul ignore else*/
if (!Array.prototype.pushUniqueValueKey) {
  Array.prototype.pushUniqueValueKey = function<T>(elem: T, key: string): T[] {
    if (!this.map(value => value[key]).includes(elem[key])) {
      this.push(elem);
    }
    return this;
  };
}

/* istanbul ignore else*/
if (!Array.prototype.pushUniqueValue) {
  Array.prototype.pushUniqueValue = function<T>(elem: T): T[] {
    /* istanbul ignore else*/
    if (!this.includes(elem)) {
      this.push(elem);
    }
    return this;
  };
}

/* istanbul ignore else*/
if (!String.prototype.toLowerCaseifTrue) {
  // tslint:disable-next-line:space-before-function-paren
  String.prototype.toLowerCaseifTrue = function(ignore: boolean) {
    return ignore ? this.toLowerCase() : this;
  };
}

/* istanbul ignore else*/
if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line: no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

/**
 * This code was based on the original github:sfdx-hydrate project
 */
export default class GeneratePackageXML extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagexml --targetusername myOrg@example.com
    <?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
  `
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    configfile: flags.string({
      description: messages.getMessage('configFlagDescription')
    }),
    quickfilter: flags.string({
      char: 'q',
      description: messages.getMessage('quickfilterFlagDescription')
    }),
    matchcase: flags.boolean({
      char: 'c',
      description: messages.getMessage('matchCaseFlagDescription')
    }),
    matchwholeword: flags.boolean({
      char: 'w',
      description: messages.getMessage('matchWholeWordFlagDescription')
    }),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription')
    }),
    excludemanaged: flags.boolean({
      char: 'x',
      description: messages.getMessage('excludeManagedFlagDescription')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const packageTypes = {};
    const configFile = this.flags.configfile || false;
    const outputFile = this.flags.file || this.args.file || null;

    try {
      await this.org.refreshAuth();
      let apiVersion = this.flags.apiversion || (await this.org.retrieveMaxApiVersion());
      let quickFilters = this.flags.quickfilter
        ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',')
        : [];
      let excludeManaged = this.flags.excludemanaged || false;

      if (configFile) {
        await fs
          .readFile(configFile, 'utf8')
          .then(data => {
            const obj = JSON.parse(data);
            /* cli parameters still override whats in the config file */
            apiVersion = this.flags.apiversion || obj.apiVersion || apiVersion;
            quickFilters = this.flags.quickfilter
              ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',')
              : obj.quickfilter || [];
            excludeManaged = this.flags.excludeManaged || obj.excludeManaged === 'true' || false;
          })
          .catch(err => {
            this.throwError(err);
          });
      }

      outputFile ? this.ux.startSpinner(`Generating ${outputFile}`) : this.ux.startSpinner('Generating package.xml');
      const conn = this.org.getConnection();
      const describe = await this.getMetaData(conn, apiVersion);
      const folders = [];
      const unfolderedObjects = [];
      const ipPromise = [];
      for await (const object of describe.metadataObjects) {
        if (object.inFolder) {
          const objectType = object.xmlName.replace('Template', '');
          const promise = this.listMetaData(conn, { type: `${objectType}Folder` }, apiVersion);
          folders.push(promise);
        } else {
          let promise = this.listMetaData(conn, { type: object.xmlName }, apiVersion);
          if (object.xmlName === 'InstalledPackage') {
            ipPromise.push(promise);
          }
          unfolderedObjects.push(promise);
          if (Array.isArray(object.childXmlNames)) {
            for (const childXmlNames of object.childXmlNames) {
              promise = this.listMetaData(conn, { type: childXmlNames }, apiVersion);
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
        } else {
          folderItems = [folder];
        }
        for await (const folderItem of folderItems) {
          if (typeof folderItem !== 'undefined') {
            let objectType = folderItem.type.replace('Folder', '');
            if (objectType === 'Email') {
              objectType += 'Template';
            }
            const promise = this.listMetaData(conn, { type: objectType, folder: folderItem.fullName }, apiVersion);
            folderedObjects.push(promise);
            folderedObjects.push(folder);
          }
        }
      }

      /**
       * This part was taken from the github:sfdx-collate project
       */
      let ipRegexStr = '^(';

      if (ipPromise.length > 0) {
        const nsPrefixes = [];
        await Promise.all(
          ipPromise.map(async promise => {
            const ip = await promise;
            /* istanbul ignore else*/
            if (typeof ip !== 'undefined') {
              ip.forEach(pkg => {
                nsPrefixes.pushUniqueValue(pkg.namespacePrefix);
              });
            }
          })
        );
        nsPrefixes.forEach(prefix => {
          ipRegexStr += prefix + '|';
        });
      }

      ipRegexStr += ')+__';

      const flowDefinitionQuery = await this.toolingQuery(
        conn,
        'SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition'
      );
      const activeFlowVersions = {};
      for await (const record of flowDefinitionQuery.records) {
        if (record['ActiveVersion'] && record['LatestVersion']) {
          /* istanbul ignore else*/
          if (!activeFlowVersions[record['DeveloperName']]) {
            activeFlowVersions[record['DeveloperName']] = [];
          }
          activeFlowVersions[record['DeveloperName']] = {
            ActiveVersion: record['ActiveVersion']['VersionNumber'],
            LatestVersion: record['LatestVersion']['VersionNumber']
          };
        }
      }

      (await Promise.all(unfolderedObjects)).forEach(unfolderedObject => {
        /* istanbul ignore else*/
        if (unfolderedObject) {
          let unfolderedObjectItems = [];
          if (Array.isArray(unfolderedObject)) {
            unfolderedObjectItems = unfolderedObject;
          } else {
            unfolderedObjectItems = [unfolderedObject];
          }
          unfolderedObjectItems.forEach(metadataEntries => {
            // if (metadataEntries) {
            // if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {
            if (
              metadataEntries.type &&
              !(
                excludeManaged &&
                (RegExp(ipRegexStr).test(metadataEntries.fullName) ||
                  metadataEntries.namespacePrefix ||
                  metadataEntries.manageableState === 'installed')
              )
            ) {
              if (metadataEntries.fileName.includes('ValueSetTranslation')) {
                const x =
                  metadataEntries.fileName
                    .split('.')[1]
                    .substring(0, 1)
                    .toUpperCase() + metadataEntries.fileName.split('.')[1].substring(1);
                if (!packageTypes[x]) {
                  packageTypes[x] = [];
                }
                // this.ux.logJson(metadataEntries);
                packageTypes[x].pushUniqueValueKey(
                  {
                    fullName: metadataEntries.fullName,
                    fileName: metadataEntries.fileName
                  },
                  'fullName'
                );
              } else {
                if (!packageTypes[metadataEntries.type]) {
                  packageTypes[metadataEntries.type] = [];
                }

                if (metadataEntries.type === 'Flow' && activeFlowVersions[metadataEntries.fullName]) {
                  if (apiVersion >= 44.0) {
                    if (
                      activeFlowVersions[metadataEntries.fullName].ActiveVersion !==
                      activeFlowVersions[metadataEntries.fullName].LatestVersion
                    ) {
                      // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`);
                      packageTypes[metadataEntries.type].pushUniqueValueKey(
                        {
                          fullName: metadataEntries.fullName,
                          fileName: metadataEntries.fileName,
                          warning: `${metadataEntries.type}: ActiveVersion (${
                            activeFlowVersions[metadataEntries.fullName].ActiveVersion
                          }) differs from LatestVersion (${
                            activeFlowVersions[metadataEntries.fullName].LatestVersion
                          }) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${
                            activeFlowVersions[metadataEntries.fullName].LatestVersion
                          })!`
                        },
                        'fullName'
                      );
                    } else {
                      packageTypes[metadataEntries.type].pushUniqueValueKey(
                        {
                          fullName: metadataEntries.fullName,
                          fileName: metadataEntries.fileName
                        },
                        'fullName'
                      );
                    }
                  } else {
                    packageTypes[metadataEntries.type].pushUniqueValueKey(
                      {
                        fullName: `${metadataEntries.fullName}-${
                          activeFlowVersions[metadataEntries.fullName].ActiveVersion
                        }`,
                        fileName: metadataEntries.fileName,
                        warning: `${metadataEntries.type}: ActiveVersion (${
                          activeFlowVersions[metadataEntries.fullName].ActiveVersion
                        }) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${
                          metadataEntries.fullName
                        }-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`
                      },
                      'fullName'
                    );
                    // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`);
                  }
                } else {
                  packageTypes[metadataEntries.type].pushUniqueValueKey(
                    {
                      fullName: metadataEntries.fullName,
                      fileName: metadataEntries.fileName
                    },
                    'fullName'
                  );
                }
              }
            }
            /*             } else {
                            this.ux.error('No metadataEntry available');
                          } */
          });
        }
      });

      (await Promise.all(folderedObjects)).forEach(folderedObject => {
        /* istanbul ignore else*/
        if (folderedObject) {
          let folderedObjectItems = [];
          if (Array.isArray(folderedObject)) {
            folderedObjectItems = folderedObject;
          } else {
            folderedObjectItems = [folderedObject];
          }
          folderedObjectItems.forEach(metadataEntries => {
            // if (metadataEntries) {
            if (
              metadataEntries.type &&
              !(
                excludeManaged &&
                (RegExp(ipRegexStr).test(metadataEntries.fullName) ||
                  metadataEntries.namespacePrefix ||
                  metadataEntries.manageableState === 'installed')
              )
            ) {
              let objectType = metadataEntries.type.replace('Folder', '');
              if (objectType === 'Email') {
                objectType += 'Template';
              }
              if (!packageTypes[objectType]) {
                packageTypes[objectType] = [];
              }
              packageTypes[objectType].pushUniqueValueKey(
                {
                  fullName: metadataEntries.fullName,
                  fileName: metadataEntries.fileName
                },
                'fullName'
              );
            }
            /*             } else {
                            this.ux.error('No metadataEntry available');
                          } */
          });
        }
      });

      /* istanbul ignore else*/
      if (!packageTypes['StandardValueSet']) {
        packageTypes['StandardValueSet'] = [];
        await Promise.all(
          [
            'AccountContactMultiRoles',
            'AccountContactRole',
            'AccountOwnership',
            'AccountRating',
            'AccountType',
            'AddressCountryCode',
            'AddressStateCode',
            'AssetStatus',
            'CampaignMemberStatus',
            'CampaignStatus',
            'CampaignType',
            'CaseContactRole',
            'CaseOrigin',
            'CasePriority',
            'CaseReason',
            'CaseStatus',
            'CaseType',
            'ContactRole',
            'ContractContactRole',
            'ContractStatus',
            'EntitlementType',
            'EventSubject',
            'EventType',
            'FiscalYearPeriodName',
            'FiscalYearPeriodPrefix',
            'FiscalYearQuarterName',
            'FiscalYearQuarterPrefix',
            'IdeaCategory',
            'IdeaMultiCategory',
            'IdeaStatus',
            'IdeaThemeStatus',
            'Industry',
            'InvoiceStatus',
            'LeadSource',
            'LeadStatus',
            'OpportunityCompetitor',
            'OpportunityStage',
            'OpportunityType',
            'OrderStatus',
            'OrderType',
            'PartnerRole',
            'Product2Family',
            'QuestionOrigin',
            'QuickTextCategory',
            'QuickTextChannel',
            'QuoteStatus',
            'SalesTeamRole',
            'Salutation',
            'ServiceContractApprovalStatus',
            'SocialPostClassification',
            'SocialPostEngagementLevel',
            'SocialPostReviewedStatus',
            'SolutionStatus',
            'TaskPriority',
            'TaskStatus',
            'TaskSubject',
            'TaskType',
            'WorkOrderLineItemStatus',
            'WorkOrderPriority',
            'WorkOrderStatus'
          ].map(async member => {
            try {
              const standardvaluesets = await this.toolingQuery(
                conn,
                `SELECT metadata FROM StandardValueset WHERE masterlabel = '${member}'`
              );
              const meta = standardvaluesets.records[0]['Metadata']['standardValue'];
              if (meta.length > 0) {
                packageTypes['StandardValueSet'].pushUniqueValueKey(
                  { fullName: member, fileName: `${member}.standardValueSet` },
                  'fullName'
                );
              } else {
                this.logger.error(member + ' - Required field is missing: standardValue');
              }
            } catch (err) {
              this.logger.error({ err: serializeError(err) });
            }
          })
        );
      }

      if (apiVersion >= 44.0) {
        delete packageTypes['FlowDefinition'];
      }

      const packageJson = {
        Package: {
          $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
          types: [],
          version: apiVersion
        }
      };

      const filteredwarnings = [];
      Object.keys(packageTypes)
        .sort()
        .forEach(mdtype => {
          const fileFilters =
            quickFilters.length > 0
              ? packageTypes[mdtype]
                  .map(value => value.fileName.toLowerCaseifTrue(!this.flags.matchcase))
                  .filter(value =>
                    quickFilters.some(element =>
                      this.flags.matchwholeword ? value === element : value.includes(element)
                    )
                  )
                  .filter((value, index, self) => self.indexOf(value) === index)
              : [];

          const mdFilters =
            quickFilters.length > 0
              ? [mdtype.toLowerCaseifTrue(!this.flags.matchcase)]
                  .filter(value =>
                    quickFilters.some(element =>
                      this.flags.matchwholeword ? value === element : value.includes(element)
                    )
                  )
                  .filter((value, index, self) => self.indexOf(value) === index)
              : [];

          const mFilters =
            quickFilters.length > 0
              ? packageTypes[mdtype]
                  .map(value => value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                  .filter(value =>
                    quickFilters.some(element =>
                      this.flags.matchwholeword ? value === element : value.includes(element)
                    )
                  )
                  .filter((value, index, self) => self.indexOf(value) === index)
              : [];

          if (quickFilters.length === 0 || mdFilters.length > 0 || fileFilters.length > 0 || mFilters.length > 0) {
            packageJson.Package.types.push({
              name: mdtype,
              members: packageTypes[mdtype]
                .filter(
                  value =>
                    quickFilters.length === 0 ||
                    mdFilters.includes(mdtype.toLowerCaseifTrue(!this.flags.matchcase)) ||
                    fileFilters.includes(value.fileName.toLowerCaseifTrue(!this.flags.matchcase)) ||
                    mFilters.includes(value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                )
                .map(value => {
                  if (value.warning) {
                    filteredwarnings.push(value.warning);
                  }
                  return value.fullName;
                })
                .sort()
            });
          }
        });

      // const packageXml = convert.js2xml(packageJson, { compact: true, spaces: 4 });
      const builder = new xml2js.Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        xmlns: true
      });
      const packageXml = builder.buildObject(packageJson);

      /*     notifier.notify({
          title: 'sfdx-jayree packagexml',
          message: 'Finished creating pakckage.xml for: ' + this.org.getUsername()
        }); */

      filteredwarnings.forEach(value => this.ux.warn(value));

      if (outputFile) {
        await fs
          .writeFile(outputFile, packageXml)
          .then(() => this.ux.stopSpinner())
          .catch(error => {
            this.throwError(error);
          });
      } else {
        this.ux.stopSpinner();
        this.ux.styledHeader(this.org.getOrgId());
        this.ux.log(packageXml);
      }

      return {
        orgId: this.org.getOrgId(),
        packagexml: packageJson,
        warnings: filteredwarnings
      };
    } catch (error) {
      this.throwError(error);
    }
  }

  /* istanbul ignore next */
  public toolingQuery(conn: core.Connection, soql: string): Promise<jsforce.QueryResult<{}>> {
    return conn.tooling.query(soql);
  }

  /* istanbul ignore next */
  public getMetaData(conn: core.Connection, apiVersion: string): Promise<jsforce.DescribeMetadataResult> {
    return conn.metadata.describe(apiVersion);
  }

  /* istanbul ignore next */
  public listMetaData(
    conn: core.Connection,
    query: jsforce.ListMetadataQuery | jsforce.ListMetadataQuery[],
    apiVersion: string
  ): Promise<jsforce.FileProperties | jsforce.FileProperties[]> {
    return conn.metadata.list(query, apiVersion);
  }

  private throwError(err: Error) {
    this.ux.stopSpinner();
    this.logger.error({ err: serializeError(err) });
    throw err;
  }
}
