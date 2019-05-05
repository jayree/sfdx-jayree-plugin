"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
// import serializeError = require('serialize-error');
// import * as notifier from 'node-notifier';
// import * as convert from 'xml-js';
const xml2js = require("xml2js");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'packagexml');
/* istanbul ignore else*/
if (!Array.prototype.pushUniqueValueKey) {
    Array.prototype.pushUniqueValueKey = function (elem, key) {
        if (!this.map(value => value[key]).includes(elem[key])) {
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
    // tslint:disable-next-line:space-before-function-paren
    String.prototype.toLowerCaseifTrue = function (ignore) {
        return ignore ? this.toLowerCase() : this;
    };
}
/* istanbul ignore next*/
if (Symbol['asyncIterator'] === undefined) {
    // tslint:disable-next-line: no-any
    Symbol['asyncIterator'] = Symbol.for('asyncIterator');
}
/**
 * This code was based on the original github:sfdx-hydrate project
 */
class GeneratePackageXML extends command_1.SfdxCommand {
    async run() {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        const packageTypes = {};
        const configFile = this.flags.configfile || false;
        const outputFile = this.flags.file || this.args.file || null;
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
        for (let retries = 0;; retries++) {
            try {
                const conn = this.org.getConnection();
                const describe = await this.getMetaData(conn, apiVersion);
                const folders = [];
                const unfolderedObjects = [];
                const ipPromise = [];
                try {
                    for (var _e = __asyncValues(describe.metadataObjects), _f; _f = await _e.next(), !_f.done;) {
                        const object = _f.value;
                        if (object.inFolder) {
                            const objectType = object.xmlName.replace('Template', '');
                            const promise = this.listMetaData(conn, { type: `${objectType}Folder` }, apiVersion);
                            folders.push(promise);
                        }
                        else {
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
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_a = _e.return)) await _a.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const folderedObjects = [];
                try {
                    for (var folders_1 = __asyncValues(folders), folders_1_1; folders_1_1 = await folders_1.next(), !folders_1_1.done;) {
                        const folder = folders_1_1.value;
                        let folderItems = [];
                        if (Array.isArray(folder)) {
                            folderItems = folder;
                        }
                        else {
                            folderItems = [folder];
                        }
                        try {
                            for (var folderItems_1 = __asyncValues(folderItems), folderItems_1_1; folderItems_1_1 = await folderItems_1.next(), !folderItems_1_1.done;) {
                                const folderItem = folderItems_1_1.value;
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
                /**
                 * This part was taken from the github:sfdx-collate project
                 */
                let ipRegexStr = '^(';
                // if (ipPromise.length > 0) {
                //   const nsPrefixes = [];
                //   await Promise.all(
                //     ipPromise.map(async promise => {
                //       const ip = await promise;
                //       /* istanbul ignore else*/
                //       if (typeof ip !== 'undefined') {
                //         ip.forEach(pkg => {
                //           nsPrefixes.pushUniqueValue(pkg.namespacePrefix);
                //         });
                //       }
                //     })
                //   );
                //   nsPrefixes.forEach(prefix => {
                //     ipRegexStr += prefix + '|';
                //   });
                // }
                ipRegexStr += ')+__';
                const flowDefinitionQuery = await this.toolingQuery(conn, 'SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition');
                const activeFlowVersions = {};
                try {
                    for (var _g = __asyncValues(flowDefinitionQuery.records), _h; _h = await _g.next(), !_h.done;) {
                        const record = _h.value;
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
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_d = _g.return)) await _d.call(_g);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                (await Promise.all(unfolderedObjects)).forEach(unfolderedObject => {
                    /* istanbul ignore else*/
                    if (unfolderedObject) {
                        let unfolderedObjectItems = [];
                        if (Array.isArray(unfolderedObject)) {
                            unfolderedObjectItems = unfolderedObject;
                        }
                        else {
                            unfolderedObjectItems = [unfolderedObject];
                        }
                        unfolderedObjectItems.forEach(metadataEntries => {
                            // if (metadataEntries) {
                            // if ((metadataEntries.type && metadataEntries.manageableState !== 'installed') || (metadataEntries.type && metadataEntries.manageableState === 'installed' && !excludeManaged)) {
                            if (metadataEntries.type &&
                                !(excludeManaged &&
                                    (RegExp(ipRegexStr).test(metadataEntries.fullName) ||
                                        metadataEntries.namespacePrefix ||
                                        metadataEntries.manageableState === 'installed'))) {
                                if (typeof metadataEntries.type !== 'string') {
                                    this.logger.error('type missing for: ' + metadataEntries.fileName);
                                    const x = metadataEntries.fileName
                                        .split('.')[1]
                                        .substring(0, 1)
                                        .toUpperCase() + metadataEntries.fileName.split('.')[1].substring(1);
                                    if (!packageTypes[x]) {
                                        packageTypes[x] = [];
                                    }
                                    // this.ux.logJson(metadataEntries);
                                    packageTypes[x].pushUniqueValueKey({
                                        fullName: metadataEntries.fullName,
                                        fileName: metadataEntries.fileName
                                    }, 'fullName');
                                }
                                else {
                                    if (!packageTypes[metadataEntries.type]) {
                                        packageTypes[metadataEntries.type] = [];
                                    }
                                    if (metadataEntries.type === 'Flow' && activeFlowVersions[metadataEntries.fullName]) {
                                        if (apiVersion >= 44.0) {
                                            if (activeFlowVersions[metadataEntries.fullName].ActiveVersion !==
                                                activeFlowVersions[metadataEntries.fullName].LatestVersion) {
                                                // this.ux.warn(`${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`);
                                                packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                    fullName: metadataEntries.fullName,
                                                    fileName: metadataEntries.fileName,
                                                    warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) differs from LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion}) for '${metadataEntries.fullName}' - you will retrieve LatestVersion (${activeFlowVersions[metadataEntries.fullName].LatestVersion})!`
                                                }, 'fullName');
                                            }
                                            else {
                                                packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                    fullName: metadataEntries.fullName,
                                                    fileName: metadataEntries.fileName
                                                }, 'fullName');
                                            }
                                        }
                                        else {
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: `${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}`,
                                                fileName: metadataEntries.fileName,
                                                warning: `${metadataEntries.type}: ActiveVersion (${activeFlowVersions[metadataEntries.fullName].ActiveVersion}) for '${metadataEntries.fullName}' found - changing '${metadataEntries.fullName}' to '${metadataEntries.fullName}-${activeFlowVersions[metadataEntries.fullName].ActiveVersion}'`
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
                                                fileName: 'objects/PersonAccount.object'
                                            }, 'fullName');
                                        }
                                        else if (metadataEntries.fullName === 'Account.Standard_PersonAccount_Match_Rule_v1_0' &&
                                            metadataEntries.fileName === 'matchingRules/Account.matchingRule' &&
                                            metadataEntries.type === 'MatchingRule') {
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: 'PersonAccount.Standard_PersonAccount_Match_Rule_v1_0',
                                                fileName: 'matchingRules/PersonAccount.matchingRule'
                                            }, 'fullName');
                                        }
                                        else {
                                            packageTypes[metadataEntries.type].pushUniqueValueKey({
                                                fullName: metadataEntries.fullName,
                                                fileName: metadataEntries.fileName
                                            }, 'fullName');
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
                (await Promise.all(folderedObjects)).forEach(folderedObject => {
                    /* istanbul ignore else*/
                    if (folderedObject) {
                        let folderedObjectItems = [];
                        if (Array.isArray(folderedObject)) {
                            folderedObjectItems = folderedObject;
                        }
                        else {
                            folderedObjectItems = [folderedObject];
                        }
                        folderedObjectItems.forEach(metadataEntries => {
                            // if (metadataEntries) {
                            if (metadataEntries.type &&
                                !(excludeManaged &&
                                    (RegExp(ipRegexStr).test(metadataEntries.fullName) ||
                                        metadataEntries.namespacePrefix ||
                                        metadataEntries.manageableState === 'installed'))) {
                                let objectType = metadataEntries.type.replace('Folder', '');
                                if (objectType === 'Email') {
                                    objectType += 'Template';
                                }
                                if (!packageTypes[objectType]) {
                                    packageTypes[objectType] = [];
                                }
                                packageTypes[objectType].pushUniqueValueKey({
                                    fullName: metadataEntries.fullName,
                                    fileName: metadataEntries.fileName
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
                    await Promise.all([
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
                    ].map(async (member) => {
                        try {
                            const standardvaluesets = await this.toolingQuery(conn, `SELECT metadata FROM StandardValueset WHERE masterlabel = '${member}'`);
                            const meta = standardvaluesets.records[0]['Metadata']['standardValue'];
                            if (meta.length > 0) {
                                packageTypes['StandardValueSet'].pushUniqueValueKey({ fullName: member, fileName: `${member}.standardValueSet` }, 'fullName');
                            }
                            else {
                                this.logger.error(member + ' - Required field is missing: standardValue');
                            }
                        }
                        catch (err) {
                            // this.logger.error({ stack: err.stack }, err.message);
                            this.logger.error(err.stack);
                        }
                    }));
                }
                if (apiVersion >= 44.0) {
                    delete packageTypes['FlowDefinition'];
                }
                // fix Product / Product2
                /* istanbul ignore next */
                if (packageTypes['CustomObjectTranslation']) {
                    const allcustomlang = packageTypes['CustomObjectTranslation']
                        .filter(element => {
                        const x = element.fullName.split('__');
                        return x.length === 2;
                    })
                        .map(element => element.fullName.split('-')[1])
                        .filter((value, index, self) => self.indexOf(value) === index);
                    allcustomlang.forEach(lng => {
                        packageTypes['CustomObjectTranslation'].pushUniqueValueKey({
                            fullName: 'Product-' + lng,
                            fileName: 'objectTranslations/Product-' + lng + '.objectTranslation'
                        }, 'fullName');
                    });
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
                    const fileFilters = quickFilters.length > 0
                        ? packageTypes[mdtype]
                            .map(value => value.fileName.toLowerCaseifTrue(!this.flags.matchcase))
                            .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
                            .filter((value, index, self) => self.indexOf(value) === index)
                        : [];
                    const mdFilters = quickFilters.length > 0
                        ? [mdtype.toLowerCaseifTrue(!this.flags.matchcase)]
                            .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
                            .filter((value, index, self) => self.indexOf(value) === index)
                        : [];
                    const mFilters = quickFilters.length > 0
                        ? packageTypes[mdtype]
                            .map(value => value.fullName.toLowerCaseifTrue(!this.flags.matchcase))
                            .filter(value => quickFilters.some(element => this.flags.matchwholeword ? value === element : value.includes(element)))
                            .filter((value, index, self) => self.indexOf(value) === index)
                        : [];
                    if (quickFilters.length === 0 || mdFilters.length > 0 || fileFilters.length > 0 || mFilters.length > 0) {
                        packageJson.Package.types.push({
                            name: mdtype,
                            members: packageTypes[mdtype]
                                .filter(value => quickFilters.length === 0 ||
                                mdFilters.includes(mdtype.toLowerCaseifTrue(!this.flags.matchcase)) ||
                                fileFilters.includes(value.fileName.toLowerCaseifTrue(!this.flags.matchcase)) ||
                                mFilters.includes(value.fullName.toLowerCaseifTrue(!this.flags.matchcase)))
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
                }
                else {
                    this.ux.stopSpinner();
                    this.ux.styledHeader(this.org.getOrgId());
                    this.ux.log(packageXml);
                }
                return {
                    orgId: this.org.getOrgId(),
                    packagexml: packageJson,
                    warnings: filteredwarnings
                };
            }
            catch (error) {
                /* istanbul ignore next */
                if ((error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') && retries < 10) {
                    this.logger.error('retry: ' + error.code + ' ' + (retries + 1).toString());
                    continue;
                }
                else {
                    this.throwError(error);
                }
            }
        }
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
GeneratePackageXML.description = messages.getMessage('commandDescription');
GeneratePackageXML.examples = [
    `$ sfdx jayree:packagexml --targetusername myOrg@example.com
    <?xml version="1.0" encoding="UTF-8"?>
    <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
  `
];
GeneratePackageXML.args = [{ name: 'file' }];
GeneratePackageXML.flagsConfig = {
    configfile: command_1.flags.string({
        description: messages.getMessage('configFlagDescription')
    }),
    quickfilter: command_1.flags.string({
        char: 'q',
        description: messages.getMessage('quickfilterFlagDescription')
    }),
    matchcase: command_1.flags.boolean({
        char: 'c',
        description: messages.getMessage('matchCaseFlagDescription')
    }),
    matchwholeword: command_1.flags.boolean({
        char: 'w',
        description: messages.getMessage('matchWholeWordFlagDescription')
    }),
    file: command_1.flags.string({
        char: 'f',
        description: messages.getMessage('fileFlagDescription')
    }),
    excludemanaged: command_1.flags.boolean({
        char: 'x',
        description: messages.getMessage('excludeManagedFlagDescription')
    })
};
GeneratePackageXML.requiresUsername = true;
GeneratePackageXML.supportsDevhubUsername = false;
GeneratePackageXML.requiresProject = false;
exports.default = GeneratePackageXML;
//# sourceMappingURL=packagexml.js.map