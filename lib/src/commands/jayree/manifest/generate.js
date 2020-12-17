"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const fs = tslib_1.__importStar(require("fs-extra"));
const xml_1 = require("../../../utils/xml");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'packagexml');
/* istanbul ignore else*/
if (!Array.prototype.pushUniqueValueKey) {
    Array.prototype.pushUniqueValueKey = function (elem, key) {
        if (!this.map((value) => value[key]).includes(elem[key])) {
            this.push(elem);
        }
        return this;
    };
}
/* istanbul ignore next*/
if (!Array.prototype.pushUniqueValue) {
    Array.prototype.pushUniqueValue = function (elem) {
        if (!this.includes(elem)) {
            this.push(elem);
        }
        return this;
    };
}
/* istanbul ignore else*/
if (!String.prototype.toLowerCaseifTrue) {
    String.prototype.toLowerCaseifTrue = function (ignore) {
        return ignore ? this.toLowerCase() : this;
    };
}
/**
 * This code was based on the original github:sfdx-hydrate project
 */
class GeneratePackageXML extends command_1.SfdxCommand {
    // eslint-disable-next-line complexity
    async run() {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e;
        const packageTypes = {};
        const configFile = this.flags.configfile || false;
        const outputFile = this.flags.file || this.args.file || null;
        let sfdxProjectVersion;
        /* istanbul ignore next*/
        try {
            this.project = await command_1.core.SfdxProject.resolve();
            const sfdxProjectJson = await this.project.retrieveSfdxProjectJson();
            sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
            // eslint-disable-next-line no-empty
        }
        catch (error) { }
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
            try {
                for (var _f = tslib_1.__asyncValues(describe.metadataObjects), _g; _g = await _f.next(), !_g.done;) {
                    const object = _g.value;
                    if (object.inFolder) {
                        const objectType = object.xmlName.replace('Template', '');
                        const promise = this.listMetaData(conn, {
                            type: `${objectType}Folder`,
                        }, apiVersion);
                        folders.push(promise);
                    }
                    else {
                        let promise = this.listMetaData(conn, { type: object.xmlName }, apiVersion);
                        if (object.xmlName === 'InstalledPackage') {
                            ipPromise.push(promise);
                        }
                        try {
                            unfolderedObjects.push(await promise);
                        }
                        catch (error) {
                            /* istanbul ignore next */
                            this.logger.error('unfolderedObjects promise error: ' + error);
                        }
                        if (Array.isArray(object.childXmlNames)) {
                            for (const childXmlNames of object.childXmlNames) {
                                promise = this.listMetaData(conn, { type: childXmlNames }, apiVersion);
                                try {
                                    unfolderedObjects.push(await promise);
                                }
                                catch (error) {
                                    /* istanbul ignore next */
                                    this.logger.error('unfolderedObjects promise error: ' + error);
                                }
                            }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_a = _f.return)) await _a.call(_f);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const folderedObjects = [];
            try {
                for (var folders_1 = tslib_1.__asyncValues(folders), folders_1_1; folders_1_1 = await folders_1.next(), !folders_1_1.done;) {
                    const folder = folders_1_1.value;
                    let folderItems = [];
                    if (Array.isArray(folder)) {
                        folderItems = folder;
                    }
                    else {
                        folderItems = [folder];
                    }
                    try {
                        for (var folderItems_1 = (e_3 = void 0, tslib_1.__asyncValues(folderItems)), folderItems_1_1; folderItems_1_1 = await folderItems_1.next(), !folderItems_1_1.done;) {
                            const folderItem = folderItems_1_1.value;
                            if (typeof folderItem !== 'undefined') {
                                let objectType = folderItem.type.replace('Folder', '');
                                if (objectType === 'Email') {
                                    objectType += 'Template';
                                }
                                const promise = this.listMetaData(conn, {
                                    type: objectType,
                                    folder: folderItem.fullName,
                                }, apiVersion);
                                try {
                                    folderedObjects.push(await promise);
                                }
                                catch (error) {
                                    /* istanbul ignore next */
                                    this.logger.error('folderedObjects promise error: ' + error);
                                }
                                folderedObjects.push(folder);
                            }
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (folderItems_1_1 && !folderItems_1_1.done && (_c = folderItems_1.return)) await _c.call(folderItems_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (folders_1_1 && !folders_1_1.done && (_b = folders_1.return)) await _b.call(folders_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            const flowDefinitionQuery = await this.toolingQuery(conn, 'SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition');
            const activeFlowVersions = {};
            try {
                for (var _h = tslib_1.__asyncValues(flowDefinitionQuery.records), _j; _j = await _h.next(), !_j.done;) {
                    const record = _j.value;
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
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_d = _h.return)) await _d.call(_h);
                }
                finally { if (e_4) throw e_4.error; }
            }
            if (this.flags.includeflowversions) {
                try {
                    const flowObject = this.listMetaData(conn, { type: 'Flow' }, '43.0');
                    /* istanbul ignore next*/
                    if (typeof flowObject !== 'undefined') {
                        unfolderedObjects.push(await flowObject);
                    }
                    // eslint-disable-next-line no-empty
                }
                catch (err) { }
            }
            unfolderedObjects.forEach((unfolderedObject) => {
                /* istanbul ignore else*/
                if (unfolderedObject) {
                    let unfolderedObjectItems = [];
                    if (Array.isArray(unfolderedObject)) {
                        unfolderedObjectItems = unfolderedObject;
                    }
                    else {
                        unfolderedObjectItems = [unfolderedObject];
                    }
                    // eslint-disable-next-line complexity
                    unfolderedObjectItems.forEach((metadataEntries) => {
                        /*               if (metadataEntries.type === 'CustomApplication') {
                            console.log(metadataEntries);
                          } */
                        // if (metadataEntries) {
                        // if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {
                        if (metadataEntries.type &&
                            !(excludeManaged &&
                                ((metadataEntries.namespacePrefix && metadataEntries.manageableState !== 'unmanaged') ||
                                    metadataEntries.manageableState === 'installed'))) {
                            if (typeof metadataEntries.type !== 'string') {
                                this.logger.error('type missing for: ' + metadataEntries.fileName);
                                const x = metadataEntries.fileName.split('.')[1].substring(0, 1).toUpperCase() +
                                    metadataEntries.fileName.split('.')[1].substring(1);
                                if (!packageTypes[x]) {
                                    packageTypes[x] = [];
                                }
                                // this.ux.logJson(metadataEntries);
                                packageTypes[x].pushUniqueValueKey({
                                    fullName: metadataEntries.fullName,
                                    fileName: metadataEntries.fileName,
                                }, 'fullName');
                            }
                            else {
                                if (!packageTypes[metadataEntries.type]) {
                                    packageTypes[metadataEntries.type] = [];
                                }
                                if (metadataEntries.type === 'Flow' &&
                                    activeFlowVersions[metadataEntries.fullName] &&
                                    activeFlowVersions[metadataEntries.fullName].ActiveVersion) {
                                    if (apiVersion >= 44.0) {
                                        if (activeFlowVersions[metadataEntries.fullName].ActiveVersion !==
                                            activeFlowVersions[metadataEntries.fullName].LatestVersion) {
                                            // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`);
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: metadataEntries.fullName,
                                                fileName: metadataEntries.fileName,
                                                warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`,
                                            }, 'fullName');
                                        }
                                        else {
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: metadataEntries.fullName,
                                                fileName: metadataEntries.fileName,
                                            }, 'fullName');
                                        }
                                    }
                                    else {
                                        packageTypes[metadataEntries.type].pushUniqueValueKey({
                                            fullName: `${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}`,
                                            fileName: metadataEntries.fileName,
                                            warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`,
                                        }, 'fullName');
                                        // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`);
                                    }
                                }
                                else {
                                    /* istanbul ignore next */
                                    if (metadataEntries.fullName === 'Account.PersonAccount' &&
                                        metadataEntries.fileName === 'objects/Account.object' &&
                                        metadataEntries.type === 'RecordType') {
                                        packageTypes[metadataEntries.type].pushUniqueValueKey({
                                            fullName: 'PersonAccount.PersonAccount',
                                            fileName: 'objects/PersonAccount.object',
                                        }, 'fullName');
                                    }
                                    else if (metadataEntries.fullName === 'Account.Standard_PersonAccount_Match_Rule_v1_0' &&
                                        metadataEntries.fileName === 'matchingRules/Account.matchingRule' &&
                                        metadataEntries.type === 'MatchingRule') {
                                        packageTypes[metadataEntries.type].pushUniqueValueKey({
                                            fullName: 'PersonAccount.Standard_PersonAccount_Match_Rule_v1_0',
                                            fileName: 'matchingRules/PersonAccount.matchingRule',
                                        }, 'fullName');
                                    }
                                    else {
                                        if (metadataEntries.type === 'Flow' &&
                                            activeFlowVersions[metadataEntries.fullName] &&
                                            activeFlowVersions[metadataEntries.fullName].ActiveVersion == null) {
                                            if (this.flags.includeflowversions) {
                                                packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                    fullName: `${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].LatestVersion}`,
                                                    fileName: metadataEntries.fileName,
                                                    warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) not found for '${metadataEntries.fullName}' - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].LatestVersion}'`,
                                                }, 'fullName');
                                            }
                                            else {
                                                packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                    fullName: metadataEntries.fullName,
                                                    fileName: metadataEntries.fileName,
                                                    warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) not found for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`,
                                                }, 'fullName');
                                            }
                                        }
                                        else {
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: metadataEntries.fullName,
                                                fileName: metadataEntries.fileName,
                                            }, 'fullName');
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
                    }
                    else {
                        folderedObjectItems = [folderedObject];
                    }
                    folderedObjectItems.forEach((metadataEntries) => {
                        // if (metadataEntries) {
                        if (metadataEntries.type &&
                            !(excludeManaged && (metadataEntries.namespacePrefix || metadataEntries.manageableState === 'installed'))) {
                            let objectType = metadataEntries.type.replace('Folder', '');
                            if (objectType === 'Email') {
                                objectType += 'Template';
                            }
                            if (!packageTypes[objectType]) {
                                packageTypes[objectType] = [];
                            }
                            packageTypes[objectType].pushUniqueValueKey({
                                fullName: metadataEntries.fullName,
                                fileName: metadataEntries.fileName,
                            }, 'fullName');
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
                try {
                    for (var standardvaluesetarray_1 = tslib_1.__asyncValues(standardvaluesetarray), standardvaluesetarray_1_1; standardvaluesetarray_1_1 = await standardvaluesetarray_1.next(), !standardvaluesetarray_1_1.done;) {
                        const member = standardvaluesetarray_1_1.value;
                        try {
                            const standardvaluesets = await this.toolingQuery(conn, `SELECT metadata FROM StandardValueset WHERE masterlabel = '${member}'`);
                            const meta = standardvaluesets.records[0]['Metadata']['standardValue'];
                            if (meta.length > 0) {
                                packageTypes['StandardValueSet'].pushUniqueValueKey({
                                    fullName: member,
                                    fileName: `${member}.standardValueSet`,
                                }, 'fullName');
                            }
                            else {
                                this.logger.error(member + ' - Required field is missing: standardValue');
                            }
                        }
                        catch (err) {
                            // this.logger.error({ stack: err.stack }, err.message);
                            this.logger.error(err.stack);
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (standardvaluesetarray_1_1 && !standardvaluesetarray_1_1.done && (_e = standardvaluesetarray_1.return)) await _e.call(standardvaluesetarray_1);
                    }
                    finally { if (e_5) throw e_5.error; }
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
                    packageTypes['CustomObjectTranslation'].pushUniqueValueKey({
                        fullName: 'Product-' + lng,
                        fileName: 'objectTranslations/Product-' + lng + '.objectTranslation',
                    }, 'fullName');
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
                const fileFilters = quickFilters.length > 0
                    ? packageTypes[mdtype]
                        .map((value) => value.fileName.toLowerCaseifTrue(!this.flags.matchcase))
                        .filter((value) => quickFilters.some((element) => this.flags.matchwholeword ? value === element : value.includes(element)))
                        .filter((value, index, self) => self.indexOf(value) === index)
                    : [];
                const mdFilters = quickFilters.length > 0
                    ? [mdtype.toLowerCaseifTrue(!this.flags.matchcase)]
                        .filter((value) => quickFilters.some((element) => this.flags.matchwholeword ? value === element : value.includes(element)))
                        .filter((value, index, self) => self.indexOf(value) === index)
                    : [];
                const mFilters = quickFilters.length > 0
                    ? packageTypes[mdtype]
                        .map((value) => value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                        .filter((value) => quickFilters.some((element) => this.flags.matchwholeword ? value === element : value.includes(element)))
                        .filter((value, index, self) => self.indexOf(value) === index)
                    : [];
                if (quickFilters.length === 0 || mdFilters.length > 0 || fileFilters.length > 0 || mFilters.length > 0) {
                    packageJson.Package.types.push({
                        name: mdtype,
                        members: packageTypes[mdtype]
                            .filter((value) => quickFilters.length === 0 ||
                            mdFilters.includes(mdtype.toLowerCaseifTrue(!this.flags.matchcase)) ||
                            fileFilters.includes(value.fileName.toLowerCaseifTrue(!this.flags.matchcase)) ||
                            mFilters.includes(value.fullName.toLowerCaseifTrue(!this.flags.matchcase)))
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
            const packageXml = xml_1.builder.buildObject(packageJson);
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
            }
            else {
                this.ux.stopSpinner();
                this.ux.styledHeader(this.org.getOrgId());
                this.ux.log(packageXml);
            }
            return {
                orgId: this.org.getOrgId(),
                packagexml: packageJson,
                warnings: filteredwarnings,
            };
        }
        catch (error) {
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
    toolingQuery(conn, soql) {
        return conn.tooling.query(soql);
    }
    /* istanbul ignore next */
    getMetaData(conn, apiVersion) {
        return conn.metadata.describe(apiVersion);
    }
    /* istanbul ignore next */
    listMetaData(conn, query, apiVersion) {
        return conn.metadata.list(query, apiVersion);
    }
    throwError(err) {
        this.ux.stopSpinner();
        // this.logger.error({ err: serializeError(err) });
        this.logger.error(err.stack);
        throw err;
    }
}
exports.default = GeneratePackageXML;
GeneratePackageXML.aliases = ['jayree:packagexml'];
GeneratePackageXML.description = messages.getMessage('commandDescription');
GeneratePackageXML.examples = [
    `$ sfdx jayree:manifest:generate --targetusername myOrg@example.com
    <?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
  `,
];
GeneratePackageXML.args = [{ name: 'file' }];
GeneratePackageXML.flagsConfig = {
    configfile: command_1.flags.string({
        description: messages.getMessage('configFlagDescription'),
    }),
    quickfilter: command_1.flags.string({
        char: 'q',
        description: messages.getMessage('quickfilterFlagDescription'),
    }),
    matchcase: command_1.flags.boolean({
        char: 'c',
        description: messages.getMessage('matchCaseFlagDescription'),
    }),
    matchwholeword: command_1.flags.boolean({
        char: 'w',
        description: messages.getMessage('matchWholeWordFlagDescription'),
    }),
    includeflowversions: command_1.flags.boolean({
        description: messages.getMessage('includeflowversionsDescription'),
    }),
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription'),
    }),
    excludemanaged: command_1.flags.boolean({
        char: 'x',
        description: messages.getMessage('excludeManagedFlagDescription'),
    }),
};
GeneratePackageXML.requiresUsername = true;
GeneratePackageXML.supportsDevhubUsername = false;
GeneratePackageXML.requiresProject = false;
//# sourceMappingURL=generate.js.map