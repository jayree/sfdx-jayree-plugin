"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const crypto = tslib_1.__importStar(require("crypto"));
const test_1 = require("@salesforce/command/lib/test");
const fs = require("fs-extra");
const packagexml = tslib_1.__importStar(require("../../../src/commands/jayree/manifest/generate"));
const uniqid = () => {
    return crypto.randomBytes(16).toString('hex');
};
const createdlastModifiedfields = {
    createdById: uniqid(),
    createdByName: 'User Name1',
    createdDate: '2018-01-01T00:00:00.000Z',
    lastModifiedById: uniqid(),
    lastModifiedByName: 'User Name2',
    lastModifiedDate: '2018-12-31T23:59:00.000Z',
};
/* beforeEach(() => {
  $$.SANDBOX.stub(core.Connection.prototype['metadata'], 'describe').returns(
    new Promise<jsforce.DescribeMetadataResult>(resolve => {
      resolve({
        metadataObjects: [
          {
            childXmlNames: ['CustomLabel'],
            directoryName: 'labels',
            inFolder: false,
            metaFile: false,
            suffix: 'labels',
            xmlName: 'CustomLabels'
          }
        ],
        organizationNamespace: '',
        partialSaveAllowed: false,
        testRequired: false
      });
    })
  );
}); */
describe('Flow with ActiveVersion <> LatestVersion', () => {
    beforeEach(() => {
        const flowid = uniqid();
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'flows',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'flow',
                            xmlName: 'Flow',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'flows/testflow.flow',
                    fullName: 'testflow',
                    id: flowid,
                    manageableState: 'unmanaged',
                    type: 'Flow',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [
                        {
                            attributes: {
                                type: 'FlowDefinition',
                                url: '/services/data/v44.0/tooling/sobjects/FlowDefinition/' + flowid,
                            },
                            DeveloperName: 'testflow',
                            ActiveVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + uniqid(),
                                },
                                VersionNumber: 1,
                            },
                            LatestVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 2,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '43.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=43.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow-1</members>');
        test_1.expect(ctx.stdout).to.contain('<version>43.0</version>');
        test_1.expect(ctx.stderr).to.contain("WARNING: Flow: ActiveVersion (1) for 'testflow' found - changing 'testflow' to 'testflow-1'");
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '44.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=44.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow</members>');
        test_1.expect(ctx.stdout).to.contain('<version>44.0</version>');
        test_1.expect(ctx.stderr).to.contain("WARNING: Flow: ActiveVersion (1) differs from LatestVersion (2) for 'testflow' - you will retrieve LatestVersion (2)!");
    });
});
describe('Flow with ActiveVersion = LatestVersion', () => {
    beforeEach(() => {
        const flowid = uniqid();
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'flows',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'flow',
                            xmlName: 'Flow',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'flows/testflow.flow',
                    fullName: 'testflow',
                    id: flowid,
                    manageableState: 'unmanaged',
                    type: 'Flow',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [
                        {
                            attributes: {
                                type: 'FlowDefinition',
                                url: '/services/data/v44.0/tooling/sobjects/FlowDefinition/' + flowid,
                            },
                            DeveloperName: 'testflow',
                            ActiveVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 1,
                            },
                            LatestVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 1,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '43.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=43.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow-1</members>');
        test_1.expect(ctx.stdout).to.contain('<version>43.0</version>');
        test_1.expect(ctx.stderr).to.contain("WARNING: Flow: ActiveVersion (1) for 'testflow' found - changing 'testflow' to 'testflow-1'");
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '44.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=44.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow</members>');
        test_1.expect(ctx.stdout).to.contain('<version>44.0</version>');
        test_1.expect(ctx.stderr).to.not.contain("WARNING: Flow: ActiveVersion (1) differs from LatestVersion (2) for 'testflow' - you will retrieve LatestVersion (2)!");
    });
});
describe('Flow with ActiveVersion = LatestVersion (includeflowversions)', () => {
    beforeEach(() => {
        const flowid = uniqid();
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'flows',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'flow',
                            xmlName: 'Flow',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'flows/testflow.flow',
                    fullName: 'testflow',
                    id: flowid,
                    manageableState: 'unmanaged',
                    type: 'Flow',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [
                        {
                            attributes: {
                                type: 'FlowDefinition',
                                url: '/services/data/v44.0/tooling/sobjects/FlowDefinition/' + flowid,
                            },
                            DeveloperName: 'testflow',
                            ActiveVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 1,
                            },
                            LatestVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 1,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--includeflowversions', '--apiversion', '43.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --includeflowversions --apiversion=43.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow-1</members>');
        test_1.expect(ctx.stdout).to.contain('<version>43.0</version>');
        test_1.expect(ctx.stderr).to.contain("WARNING: Flow: ActiveVersion (1) for 'testflow' found - changing 'testflow' to 'testflow-1'");
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--includeflowversions', '--apiversion', '44.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --includeflowversions --apiversion=44.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow</members>');
        test_1.expect(ctx.stdout).to.contain('<version>44.0</version>');
        test_1.expect(ctx.stderr).to.not.contain("WARNING: Flow: ActiveVersion (1) differs from LatestVersion (2) for 'testflow' - you will retrieve LatestVersion (2)!");
    });
});
describe('Flow with no ActiveVersion', () => {
    beforeEach(() => {
        const flowid = uniqid();
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'flows',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'flow',
                            xmlName: 'Flow',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'flows/testflow.flow',
                    fullName: 'testflow',
                    id: flowid,
                    manageableState: 'unmanaged',
                    type: 'Flow',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [
                        {
                            attributes: {
                                type: 'FlowDefinition',
                                url: '/services/data/v44.0/tooling/sobjects/FlowDefinition/' + flowid,
                            },
                            DeveloperName: 'testflow',
                            LatestVersion: {
                                attributes: {
                                    type: 'Flow',
                                    url: '/services/data/v44.0/tooling/sobjects/Flow/' + flowid,
                                },
                                VersionNumber: 1,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '43.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=43.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow</members>');
        test_1.expect(ctx.stdout).to.contain('<version>43.0</version>');
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--apiversion', '44.0'])
        .it('runs jayree:packagexml --targetusername test@org.com --apiversion=44.0', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>testflow</members>');
        test_1.expect(ctx.stdout).to.contain('<version>44.0</version>');
        test_1.expect(ctx.stderr).to.not.contain("WARNING: Flow: ActiveVersion (1) differs from LatestVersion (2) for 'testflow' - you will retrieve LatestVersion (2)!");
    });
});
describe('ConfigFile with all parameters', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--configfile', 'test/assets/config.json'])
        .it('runs jayree:packagexml --targetusername test@org.com --configfile=test/assets/config.json', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<version>43.0</version>');
    });
});
describe('ConfigFile without any parameters', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '--configfile', 'test/assets/config2.json'])
        .it('runs jayree:packagexml --targetusername test@org.com --configfile=test/assets/config.json', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<version>42.0</version>');
    });
});
describe('ConfigFile without any parameters + cli parameter for QuickFilter', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command([
        'jayree:packagexml',
        '--targetusername',
        'test@org.com',
        '--configfile',
        'test/assets/config2.json',
        '--quickfilter',
        'Report',
    ])
        .it('runs jayree:packagexml --targetusername test@org.com --configfile=test/assets/config.json --quickfilter=Report', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<version>42.0</version>');
    });
});
describe('ConfigFile does not exist', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command([
        'jayree:packagexml',
        '--targetusername',
        'test@org.com',
        '--configfile',
        'test/assets/does_not_exist.json',
    ])
        .it('runs jayree:packagexml --targetusername test@org.com --configfile=test/assets/does_not_exist.json', (ctx) => {
        test_1.expect(ctx.stderr).to.contain('ENOENT: no such file or directory');
    });
});
describe('Installed Packages', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'installedPackages',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'installedPackage',
                            xmlName: 'InstalledPackage',
                        },
                        {
                            childXmlNames: ['CustomLabel'],
                            directoryName: 'labels',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'labels',
                            xmlName: 'CustomLabels',
                        },
                        {
                            directoryName: 'reports',
                            inFolder: true,
                            metaFile: false,
                            suffix: 'report',
                            xmlName: 'Report',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'installedPackages/sf_chttr_apps.installedPackage',
                    fullName: 'sf_chttr_apps',
                    id: uniqid(),
                    namespacePrefix: 'sf_chttr_apps',
                    type: 'InstalledPackage',
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'customlabelname',
                    id: uniqid(),
                    manageableState: 'installed',
                    namespacePrefix: 'mypackage',
                    type: 'CustomLabel',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
    });
});
describe('Exclude Installed Packages', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'installedPackages',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'installedPackage',
                            xmlName: 'InstalledPackage',
                        },
                        {
                            childXmlNames: ['CustomLabel'],
                            directoryName: 'labels',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'labels',
                            xmlName: 'CustomLabels',
                        },
                        {
                            directoryName: 'reports',
                            inFolder: true,
                            metaFile: false,
                            suffix: 'report',
                            xmlName: 'Report',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'installedPackages/sf_chttr_apps.installedPackage',
                    fullName: 'sf_chttr_apps',
                    id: uniqid(),
                    namespacePrefix: 'sf_chttr_apps',
                    type: 'InstalledPackage',
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'customlabelname',
                    id: uniqid(),
                    manageableState: 'installed',
                    type: 'CustomLabel',
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'reports/testreports/testreport.report',
                    fullName: 'testreports/testreport',
                    id: uniqid(),
                    manageableState: 'unmanaged',
                    type: 'Report',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-x'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>Report</name>');
        test_1.expect(ctx.stdout).to.not.contain('<name>CustomLabel</name>');
        test_1.expect(ctx.stdout).to.not.contain('<members>sf_chttr_apps</members>');
    });
});
describe('ValueSetTranslations', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'globalValueSetTranslations',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'globalValueSetTranslation',
                            xmlName: 'GlobalValueSetTranslation',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'globalValueSetTranslations/testvalueset1-xx.globalValueSetTranslation',
                    fullName: 'testvalueset1-xx',
                    id: '',
                    namespacePrefix: '',
                    type: { $: { 'xsi:nil': 'true' } },
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'globalValueSetTranslations/testvalueset2-xx.globalValueSetTranslation',
                    fullName: 'testvalueset2-xx',
                    id: '',
                    namespacePrefix: '',
                    type: { $: { 'xsi:nil': 'true' } },
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>GlobalValueSetTranslation</name>');
        test_1.expect(ctx.stdout).to.contain('<members>testvalueset1-xx</members>');
        test_1.expect(ctx.stdout).to.contain('<members>testvalueset2-xx</members>');
    });
});
describe('Foldered Objects', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'email',
                            inFolder: true,
                            metaFile: true,
                            suffix: 'email',
                            xmlName: 'EmailTemplate',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData')
            .onCall(0)
            .callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'email/emailtestfolder',
                    fullName: 'emailtestfolder',
                    id: uniqid(),
                    manageableState: 'installed',
                    namespacePrefix: 'mypackage',
                    type: 'EmailFolder',
                },
            ]);
        })
            .onCall(1)
            .callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'email/emailtestfolder/test1.email',
                    fullName: 'emailtestfolder/test1',
                    id: uniqid(),
                    manageableState: 'installed',
                    namespacePrefix: 'emailtest',
                    type: 'EmailTemplate',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>EmailTemplate</name>');
        test_1.expect(ctx.stdout).to.contain('<members>emailtestfolder/test1</members>');
    });
});
describe('Foldered Objects - Single Object', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'reports',
                            inFolder: true,
                            metaFile: false,
                            suffix: 'report',
                            xmlName: 'Report',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    ...createdlastModifiedfields,
                    fileName: 'reports/testreportfolder',
                    fullName: 'testreportfolder',
                    id: uniqid(),
                    manageableState: 'unmanaged',
                    type: 'ReportFolder',
                });
            });
        })
            .onCall(1)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    ...createdlastModifiedfields,
                    fileName: 'reports/testreportfolder/testreport.report',
                    fullName: 'testreportfolder/testreport',
                    id: uniqid(),
                    manageableState: 'unmanaged',
                    type: 'Report',
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>Report</name>');
        test_1.expect(ctx.stdout).to.contain('<members>testreportfolder/testreport</members>');
    });
});
describe('Foldered Objects - undefined', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            directoryName: 'reports',
                            inFolder: true,
                            metaFile: false,
                            suffix: 'report',
                            xmlName: 'Report',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve(undefined);
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.not.contain('<name>Report</name>');
        test_1.expect(ctx.stdout).to.not.contain('<members>testreportfolder/testreport</members>');
    });
});
describe('Unfoldered Objects', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            childXmlNames: ['CustomLabel'],
                            directoryName: 'labels',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'labels',
                            xmlName: 'CustomLabels',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'CustomLabels',
                    id: '',
                    namespacePrefix: '',
                    type: 'CustomLabels',
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'customlabelname',
                    id: uniqid(),
                    manageableState: 'installed',
                    type: 'CustomLabel',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<members>CustomLabels</members>');
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
    });
});
describe('Unfoldered Objects - single  Object', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [
                        {
                            childXmlNames: ['CustomLabel'],
                            directoryName: 'labels',
                            inFolder: false,
                            metaFile: false,
                            suffix: 'labels',
                            xmlName: 'CustomLabels',
                        },
                    ],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'CustomLabels',
                    id: '',
                    namespacePrefix: '',
                    type: 'CustomLabels',
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<members>CustomLabels</members>');
    });
});
describe('QuickFilter', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return Promise.resolve({
                metadataObjects: [
                    {
                        childXmlNames: ['CustomLabel'],
                        directoryName: 'labels',
                        inFolder: false,
                        metaFile: false,
                        suffix: 'labels',
                        xmlName: 'CustomLabels',
                    },
                ],
                organizationNamespace: '',
                partialSaveAllowed: true,
                testRequired: false,
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'CustomLabels',
                    id: '',
                    namespacePrefix: '',
                    type: 'CustomLabels',
                },
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'customlabelname',
                    id: uniqid(),
                    manageableState: 'installed',
                    namespacePrefix: 'mypackage',
                    type: 'CustomLabel',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-q', 'labels/CustomLabels.labels', '-wc'])
        .it('runs jayree:packagexml --targetusername test@org.com -q labels/CustomLabels.labels -wc', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-q', 'CustomLabel', '-wc'])
        .it('runs jayree:packagexml --targetusername test@org.com -q CustomLabel -wc', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.not.contain('<name>CustomLabels</name>');
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-q', 'customlabelname', '-wc'])
        .it('runs jayree:packagexml --targetusername test@org.com -q customlabelname -wc', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.not.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-q', 'customlabelname', '-w'])
        .it('runs jayree:packagexml --targetusername test@org.com -q customlabelname -w', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.not.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-q', 'customlabelname', '-c'])
        .it('runs jayree:packagexml --targetusername test@org.com -q customlabelname -c', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('<members>customlabelname</members>');
        test_1.expect(ctx.stdout).to.not.contain('<name>CustomLabels</name>');
        test_1.expect(ctx.stdout).to.contain('<name>CustomLabel</name>');
    });
});
describe('Write File', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return Promise.resolve({
                metadataObjects: [
                    {
                        childXmlNames: ['CustomLabel'],
                        directoryName: 'labels',
                        inFolder: false,
                        metaFile: false,
                        suffix: 'labels',
                        xmlName: 'CustomLabels',
                    },
                ],
                organizationNamespace: '',
                partialSaveAllowed: true,
                testRequired: false,
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'CustomLabels',
                    id: '',
                    namespacePrefix: '',
                    type: 'CustomLabels',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-f', 'test/assets/test.xml'])
        .it('runs jayree:packagexml --targetusername test@org.com -f test/assets/test.xml', (ctx) => {
        test_1.expect(ctx.stderr).to.contain('Generating test/assets/test.xml');
    });
});
describe('Write File - Error', () => {
    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        test_1.$$.SANDBOX.stub(fs, 'writeFile').callsFake(async () => {
            throw Error('EACCES: permission denied');
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return Promise.resolve({
                metadataObjects: [
                    {
                        childXmlNames: ['CustomLabel'],
                        directoryName: 'labels',
                        inFolder: false,
                        metaFile: false,
                        suffix: 'labels',
                        xmlName: 'CustomLabels',
                    },
                ],
                organizationNamespace: '',
                partialSaveAllowed: true,
                testRequired: false,
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([
                {
                    ...createdlastModifiedfields,
                    fileName: 'labels/CustomLabels.labels',
                    fullName: 'CustomLabels',
                    id: '',
                    namespacePrefix: '',
                    type: 'CustomLabels',
                },
            ]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com', '-f', 'test/assets/test.xml'])
        .it('runs jayree:packagexml --targetusername test@org.com -f test/assets/test.xml', (ctx) => {
        test_1.expect(ctx.stderr).to.contain('EACCES: permission denied');
    });
});
describe('Unfoldered Objects - Error', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return Promise.resolve(null);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData').callsFake(async () => {
            return Promise.resolve([]);
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stderr).to.contain("Cannot read property 'metadataObjects' of null");
    });
});
describe('test valid standardValueSet', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve(undefined);
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        })
            .onCall(1)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 1,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'StandardValueSet',
                    records: [
                        {
                            attributes: {
                                type: 'StandardValueSet',
                                url: '/services/data/v44.0/tooling/sobjects/StandardValueSet/AccountContactMultiRoles',
                            },
                            Metadata: {
                                groupingStringEnum: null,
                                sorted: false,
                                standardValue: [
                                    {
                                        label: 'User',
                                        valueName: 'User',
                                    },
                                ],
                                urls: null,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.contain('AccountContactMultiRoles');
    });
});
describe('test invalid standardValueSet', () => {
    beforeEach(() => {
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'getMetaData').callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    metadataObjects: [],
                    organizationNamespace: '',
                    partialSaveAllowed: true,
                    testRequired: false,
                });
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'listMetaData')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve(undefined);
            });
        });
        test_1.$$.SANDBOX.stub(packagexml.default.prototype, 'toolingQuery')
            .onCall(0)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 0,
                    totalSize: 10,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'FlowDefinition',
                    records: [],
                });
            });
        })
            .onCall(1)
            .callsFake(async () => {
            return new Promise((resolve) => {
                resolve({
                    size: 1,
                    totalSize: 1,
                    done: true,
                    queryLocator: null,
                    entityTypeName: 'StandardValueSet',
                    records: [
                        {
                            attributes: {
                                type: 'StandardValueSet',
                                url: '/services/data/v44.0/tooling/sobjects/StandardValueSet/AccountContactMultiRoles',
                            },
                            Metadata: {
                                groupingStringEnum: null,
                                sorted: false,
                                standardValue: [],
                                urls: null,
                            },
                        },
                    ],
                });
            });
        });
    });
    test_1.test
        .stdout()
        .stderr()
        .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
        .it('runs jayree:packagexml --targetusername test@org.com', (ctx) => {
        test_1.expect(ctx.stdout).to.not.contain('AccountContactMultiRoles');
    });
});
//# sourceMappingURL=packagexml.test.js.map