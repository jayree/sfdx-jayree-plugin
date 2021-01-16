/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import * as jsforce from 'jsforce';
import { builder } from '../../../utils/xml';

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'packagexml');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  Array.prototype.pushUniqueValueKey = function <T>(elem: T, key: string): T[] {
    if (!this.map((value) => value[key]).includes(elem[key])) {
      this.push(elem);
    }
    return this;
  };
}

/* istanbul ignore next*/
if (!Array.prototype.pushUniqueValue) {
  Array.prototype.pushUniqueValue = function <T>(elem: T): T[] {
    if (!this.includes(elem)) {
      this.push(elem);
    }
    return this;
  };
}

/* istanbul ignore else*/
if (!String.prototype.toLowerCaseifTrue) {
  String.prototype.toLowerCaseifTrue = function (ignore: boolean) {
    return ignore ? this.toLowerCase() : this;
  };
}

/**
 * This code was based on the original github:sfdx-hydrate project
 */
export default class GeneratePackageXML extends SfdxCommand {
  public static aliases = ['jayree:packagexml'];

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:manifest:generate --targetusername myOrg@example.com
    <?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
  `,
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    configfile: flags.string({
      description: messages.getMessage('configFlagDescription'),
    }),
    quickfilter: flags.string({
      char: 'q',
      description: messages.getMessage('quickfilterFlagDescription'),
    }),
    matchcase: flags.boolean({
      char: 'c',
      description: messages.getMessage('matchCaseFlagDescription'),
    }),
    matchwholeword: flags.boolean({
      char: 'w',
      description: messages.getMessage('matchWholeWordFlagDescription'),
    }),
    includeflowversions: flags.boolean({
      description: messages.getMessage('includeflowversionsDescription'),
    }),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
    }),
    excludemanaged: flags.boolean({
      char: 'x',
      description: messages.getMessage('excludeManagedFlagDescription'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  // eslint-disable-next-line complexity
  public async run(): Promise<AnyJson> {
    const packageTypes = {};
    const configFile = this.flags.configfile || false;
    const outputFile = this.flags.file || this.args.file || null;

    let sfdxProjectVersion;
    /* istanbul ignore next*/
    try {
      this.project = await core.SfdxProject.resolve();
      const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
      sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
      // eslint-disable-next-line no-empty
    } catch (error) {}

    let apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());

    let quickFilters = this.flags.quickfilter
      ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',')
      : [];
    let excludeManaged = this.flags.excludemanaged || false;

    if (configFile) {
      await fs
        .readFile(configFile, 'utf8')
        .then((data) => {
          const obj = JSON.parse(data);
          /* cli parameters still override whats in the config file */
          apiVersion = obj.apiVersion || apiVersion;
          quickFilters = this.flags.quickfilter
            ? this.flags.quickfilter.toLowerCaseifTrue(!this.flags.matchcase).split(',')
            : obj.quickfilter || [];
          excludeManaged = this.flags.excludeManaged || obj.excludeManaged === 'true' || false;
        })
        .catch((err) => {
          this.throwError(err);
        });
    }

    // eslint-disable-next-line no-unused-expressions
    outputFile ? this.ux.startSpinner(`Generating ${outputFile}`) : this.ux.startSpinner('Generating package.xml');

    // for (let retries = 0; ; retries++) {
    try {
      const conn = this.org.getConnection();
      const describe = await this.getMetaData(conn, apiVersion);
      const folders = [];
      const unfolderedObjects = [];
      const ipPromise = [];
      for await (const object of describe.metadataObjects) {
        if (object.inFolder) {
          const objectType = object.xmlName.replace('Template', '');
          const promise = this.listMetaData(
            conn,
            {
              type: `${objectType}Folder`,
            },
            apiVersion
          );
          folders.push(promise);
        } else {
          let promise = this.listMetaData(conn, { type: object.xmlName }, apiVersion);
          if (object.xmlName === 'InstalledPackage') {
            ipPromise.push(promise);
          }
          try {
            unfolderedObjects.push(await promise);
          } catch (error) {
            /* istanbul ignore next */
            this.logger.error('unfolderedObjects promise error: ' + error);
          }
          if (Array.isArray(object.childXmlNames)) {
            for (const childXmlNames of object.childXmlNames) {
              promise = this.listMetaData(conn, { type: childXmlNames }, apiVersion);
              try {
                unfolderedObjects.push(await promise);
              } catch (error) {
                /* istanbul ignore next */
                this.logger.error('unfolderedObjects promise error: ' + error);
              }
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
            const promise = this.listMetaData(
              conn,
              {
                type: objectType,
                folder: folderItem.fullName,
              },
              apiVersion
            );
            try {
              folderedObjects.push(await promise);
            } catch (error) {
              /* istanbul ignore next */
              this.logger.error('folderedObjects promise error: ' + error);
            }
            folderedObjects.push(folder);
          }
        }
      }

      const flowDefinitionQuery = await this.toolingQuery(
        conn,
        'SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition'
      );
      const activeFlowVersions = {};
      for await (const record of flowDefinitionQuery.records) {
        // if (record['ActiveVersion'] && record['LatestVersion']) {
        /* istanbul ignore else*/
        if (!activeFlowVersions[record['DeveloperName']]) {
          activeFlowVersions[record['DeveloperName']] = [];
        }
        activeFlowVersions[record['DeveloperName']].ActiveVersion = record['ActiveVersion']
          ? record['ActiveVersion']['VersionNumber']
          : null;
        /* istanbul ignore next*/
        activeFlowVersions[record['DeveloperName']].LatestVersion = record['LatestVersion']
          ? record['LatestVersion']['VersionNumber']
          : null;
        // }
      }

      if (this.flags.includeflowversions) {
        try {
          const flowObject = this.listMetaData(conn, { type: 'Flow' }, '43.0');
          /* istanbul ignore next*/
          if (typeof flowObject !== 'undefined') {
            unfolderedObjects.push(await flowObject);
          }
          // eslint-disable-next-line no-empty
        } catch (err) {}
      }

      unfolderedObjects.forEach((unfolderedObject) => {
        /* istanbul ignore else*/
        if (unfolderedObject) {
          let unfolderedObjectItems = [];
          if (Array.isArray(unfolderedObject)) {
            unfolderedObjectItems = unfolderedObject;
          } else {
            unfolderedObjectItems = [unfolderedObject];
          }
          // eslint-disable-next-line complexity
          unfolderedObjectItems.forEach((metadataEntries) => {
            /*               if (metadataEntries.type === 'CustomApplication') {
                console.log(metadataEntries);
              } */
            // if (metadataEntries) {
            // if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {
            if (
              metadataEntries.type &&
              !(
                excludeManaged &&
                ((metadataEntries.namespacePrefix && metadataEntries.manageableState !== 'unmanaged') ||
                  metadataEntries.manageableState === 'installed')
              )
            ) {
              if (typeof metadataEntries.type !== 'string') {
                this.logger.error('type missing for: ' + metadataEntries.fileName);
                const x =
                  metadataEntries.fileName.split('.')[1].substring(0, 1).toUpperCase() +
                  metadataEntries.fileName.split('.')[1].substring(1);
                if (!packageTypes[x]) {
                  packageTypes[x] = [];
                }
                // this.ux.logJson(metadataEntries);
                packageTypes[x].pushUniqueValueKey(
                  {
                    fullName: metadataEntries.fullName,
                    fileName: metadataEntries.fileName,
                  },
                  'fullName'
                );
              } else {
                if (!packageTypes[metadataEntries.type]) {
                  packageTypes[metadataEntries.type] = [];
                }
                if (
                  metadataEntries.type === 'Flow' &&
                  activeFlowVersions[metadataEntries.fullName] &&
                  activeFlowVersions[metadataEntries.fullName].ActiveVersion
                ) {
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
                          })!`,
                        },
                        'fullName'
                      );
                    } else {
                      packageTypes[metadataEntries.type].pushUniqueValueKey(
                        {
                          fullName: metadataEntries.fullName,
                          fileName: metadataEntries.fileName,
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
                        }-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`,
                      },
                      'fullName'
                    );
                    // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`);
                  }
                } else {
                  /* istanbul ignore next */
                  if (
                    metadataEntries.fullName === 'Account.PersonAccount' &&
                    metadataEntries.fileName === 'objects/Account.object' &&
                    metadataEntries.type === 'RecordType'
                  ) {
                    packageTypes[metadataEntries.type].pushUniqueValueKey(
                      {
                        fullName: 'PersonAccount.PersonAccount',
                        fileName: 'objects/PersonAccount.object',
                      },
                      'fullName'
                    );
                  } else if (
                    metadataEntries.fullName === 'Account.Standard_PersonAccount_Match_Rule_v1_0' &&
                    metadataEntries.fileName === 'matchingRules/Account.matchingRule' &&
                    metadataEntries.type === 'MatchingRule'
                  ) {
                    packageTypes[metadataEntries.type].pushUniqueValueKey(
                      {
                        fullName: 'PersonAccount.Standard_PersonAccount_Match_Rule_v1_0',
                        fileName: 'matchingRules/PersonAccount.matchingRule',
                      },
                      'fullName'
                    );
                  } else {
                    if (
                      metadataEntries.type === 'Flow' &&
                      activeFlowVersions[metadataEntries.fullName] &&
                      activeFlowVersions[metadataEntries.fullName].ActiveVersion == null
                    ) {
                      if (this.flags.includeflowversions) {
                        packageTypes[metadataEntries.type].pushUniqueValueKey(
                          {
                            fullName: `${metadataEntries.fullName}-${
                              activeFlowVersions[metadataEntries.fullName].LatestVersion
                            }`,
                            fileName: metadataEntries.fileName,
                            warning: `${metadataEntries.type}: ActiveVersion (${
                              activeFlowVersions[metadataEntries.fullName].ActiveVersion
                            }) not found for '${metadataEntries.fullName}' - changing '${
                              metadataEntries.fullName
                            }' to '${metadataEntries.fullName}-${
                              activeFlowVersions[metadataEntries.fullName].LatestVersion
                            }'`,
                          },
                          'fullName'
                        );
                      } else {
                        packageTypes[metadataEntries.type].pushUniqueValueKey(
                          {
                            fullName: metadataEntries.fullName,
                            fileName: metadataEntries.fileName,
                            warning: `${metadataEntries.type}: ActiveVersion (${
                              activeFlowVersions[metadataEntries.fullName].ActiveVersion
                            }) not found for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${
                              activeFlowVersions[metadataEntries.fullName].LatestVersion
                            })!`,
                          },
                          'fullName'
                        );
                      }
                    } else {
                      packageTypes[metadataEntries.type].pushUniqueValueKey(
                        {
                          fullName: metadataEntries.fullName,
                          fileName: metadataEntries.fileName,
                        },
                        'fullName'
                      );
                    }
                  }
                }
              }
            }
            /*             } else {
                              this.ux.error('No metadataEntry available');
                            } */
          });
        }
      });

      folderedObjects.forEach((folderedObject) => {
        /* istanbul ignore else*/
        if (folderedObject) {
          let folderedObjectItems = [];
          if (Array.isArray(folderedObject)) {
            folderedObjectItems = folderedObject;
          } else {
            folderedObjectItems = [folderedObject];
          }
          folderedObjectItems.forEach((metadataEntries) => {
            // if (metadataEntries) {
            if (
              metadataEntries.type &&
              !(excludeManaged && (metadataEntries.namespacePrefix || metadataEntries.manageableState === 'installed'))
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
                  fileName: metadataEntries.fileName,
                },
                'fullName'
              );
              /*               console.log(metadataEntries);
                const foldernames = metadataEntries.fullName.split('/');
                foldernames.pop();
                foldernames.forEach(foldername => {
                  packageTypes[objectType].pushUniqueValueKey(
                    {
                      fullName: foldername,
                      fileName: metadataEntries.fileName
                    },
                    'fullName'
                  );
                }); */
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
        const standardvaluesetarray = [
          'AccountContactMultiRoles',
          'AccountContactRole',
          'AccountOwnership',
          'AccountRating',
          'AccountType',
          'AssetStatus',
          'CampaignMemberStatus',
          'CampaignStatus',
          'CampaignType',
          'CareItemStatus',
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
          'LeadSource',
          'LeadStatus',
          'OpportunityCompetitor',
          'OpportunityStage',
          'OpportunityType',
          'OrderStatus',
          'OrderType',
          'PartnerRole',
          'Product2Family',
          'QuantityUnitOfMeasure',
          'QuestionOrigin',
          'QuickTextCategory',
          'QuickTextChannel',
          'QuoteStatus',
          'RoleInTerritory2',
          'ResourceAbsenceType',
          'SalesTeamRole',
          'Salutation',
          'ServiceAppointmentStatus',
          'ServiceContractApprovalStatus',
          'ServTerrMemRoleType',
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
          'WorkOrderStatus',
          'WorkTypeDefApptType',
          'WorkTypeGroupAddInfo',
        ];
        for await (const member of standardvaluesetarray) {
          try {
            const standardvaluesets = await this.toolingQuery(
              conn,
              `SELECT metadata FROM StandardValueset WHERE masterlabel = '${member}'`
            );
            const meta = standardvaluesets.records[0]['Metadata']['standardValue'];
            if (meta.length > 0) {
              packageTypes['StandardValueSet'].pushUniqueValueKey(
                {
                  fullName: member,
                  fileName: `${member}.standardValueSet`,
                },
                'fullName'
              );
            } else {
              this.logger.error(member + ' - Required field is missing: standardValue');
            }
          } catch (err) {
            // this.logger.error({ stack: err.stack }, err.message);
            this.logger.error(err.stack);
          }
        }
      }

      /*       if (packageTypes['Flow'] && this.flags.includeflowversions) {
        try {
          const flowObject = await conn.metadata.list({ type: 'Flow' }, '43.0');
          if (flowObject) {
            let flowItems = [];
            if (Array.isArray(flowObject)) {
              flowItems = flowObject;
            } else {
              flowItems = [flowObject];
            }
            packageTypes['Flow'] = [];
            flowItems.forEach(metadataEntries => {
              if (metadataEntries.type && !packageTypes[metadataEntries.type]) {
                packageTypes[metadataEntries.type] = [];
              }
              packageTypes[metadataEntries.type].pushUniqueValueKey(
                {
                  fullName: metadataEntries.fullName,
                  fileName: metadataEntries.fileName
                },
                'fullName'
              );
            });
          }
        } catch (err) {}
      } */

      if (apiVersion >= 44.0) {
        delete packageTypes['FlowDefinition'];
      }

      // fix Product / Product2
      /* istanbul ignore next */
      if (packageTypes['CustomObjectTranslation']) {
        const allcustomlang = packageTypes['CustomObjectTranslation']
          .filter((element) => {
            const x = element.fullName.split('__');
            return x.length === 2;
          })
          .map((element) => element.fullName.split('-')[1])
          .filter((value, index, self) => self.indexOf(value) === index);

        allcustomlang.forEach((lng) => {
          packageTypes['CustomObjectTranslation'].pushUniqueValueKey(
            {
              fullName: 'Product-' + lng,
              fileName: 'objectTranslations/Product-' + lng + '.objectTranslation',
            },
            'fullName'
          );
        });
      }

      const packageJson = {
        Package: {
          $: {
            xmlns: 'http://soap.sforce.com/2006/04/metadata',
          },
          types: [],
          version: apiVersion,
        },
      };

      const filteredwarnings = [];
      Object.keys(packageTypes)
        .sort()
        .forEach((mdtype) => {
          const fileFilters =
            quickFilters.length > 0
              ? packageTypes[mdtype]
                  .map((value) => value.fileName.toLowerCaseifTrue(!this.flags.matchcase))
                  .filter((value) =>
                    quickFilters.some((element) =>
                      this.flags.matchwholeword ? value === element : value.includes(element)
                    )
                  )
                  .filter((value, index, self) => self.indexOf(value) === index)
              : [];

          const mdFilters =
            quickFilters.length > 0
              ? [mdtype.toLowerCaseifTrue(!this.flags.matchcase)]
                  .filter((value) =>
                    quickFilters.some((element) =>
                      this.flags.matchwholeword ? value === element : value.includes(element)
                    )
                  )
                  .filter((value, index, self) => self.indexOf(value) === index)
              : [];

          const mFilters =
            quickFilters.length > 0
              ? packageTypes[mdtype]
                  .map((value) => value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                  .filter((value) =>
                    quickFilters.some((element) =>
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
                  (value) =>
                    quickFilters.length === 0 ||
                    mdFilters.includes(mdtype.toLowerCaseifTrue(!this.flags.matchcase)) ||
                    fileFilters.includes(value.fileName.toLowerCaseifTrue(!this.flags.matchcase)) ||
                    mFilters.includes(value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                )
                .map((value) => {
                  if (value.warning) {
                    filteredwarnings.push(value.warning);
                  }
                  return value.fullName;
                })
                .sort(),
            });
          }
        });

      // if (this.flags.cleanup) {
      // do cleanup
      // }

      const packageXml = builder.buildObject(packageJson);

      /*     notifier.notify({
            title: 'sfdx-jayree packagexml',
            message: 'Finished creating pakckage.xml for: ' + this.org.getUsername()
          }); */

      filteredwarnings.forEach((value) => this.ux.warn(value));

      if (outputFile) {
        await fs
          .writeFile(outputFile, packageXml)
          .then(() => this.ux.stopSpinner())
          .catch((error) => {
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
        warnings: filteredwarnings,
      };
    } catch (error) {
      /* istanbul ignore next */
      /*         if ((error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') && retries < 10) {
          this.logger.error('retry: ' + error.code + ' ' + (retries + 1).toString());
          continue;
        } else { */
      this.throwError(error);
      // }
    }
    // }
  }

  /* istanbul ignore next */
  public toolingQuery(conn: core.Connection, soql: string): Promise<jsforce.QueryResult<Record<string, any>>> {
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
    this.logger.error(err.stack);
    throw err;
  }
}
