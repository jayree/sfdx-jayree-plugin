"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs-extra"));
const command_1 = require("@salesforce/command");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const xml2js = tslib_1.__importStar(require("xml2js"));
const sourceRetrieveBase_1 = require("../../../../sourceRetrieveBase");
const souceUtils_1 = require("../../../../utils/souceUtils");
const config_1 = tslib_1.__importDefault(require("../../../../utils/config"));
const xml_1 = require("../../../../utils/xml");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefull');
class RetrieveProfiles extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        var _a, _b;
        await this.org.refreshAuth();
        const projectpath = this.project.getPath();
        let inboundFiles = [];
        let updatedfiles = {};
        const orgretrievepath = path.join(projectpath, '.sfdx-jayree', 'orgs', this.org.getUsername(), `sdx_retrieveProfiles_${Date.now()}`);
        try {
            this.ux.log(`Using ${orgretrievepath}`);
            await fs.mkdirp(orgretrievepath);
            let packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-profiles.xml');
            const pjson = await xml2js.parseStringPromise(fs.readFileSync(packagexml, 'utf8'));
            pjson.Package.types[pjson.Package.types.findIndex((x) => x.name.toString() === 'CustomObject')].members =
                pjson.Package.types[pjson.Package.types.findIndex((x) => x.name.toString() === 'CustomObject')].members.concat(config_1.default(this.project.getPath()).ensureObjectPermissions);
            packagexml = path.join(orgretrievepath, 'pinject.xml');
            await fs.writeFile(packagexml, xml_1.builder.buildObject(pjson));
            if (!this.flags.metadata.includes('Profile') && !this.flags.metadata.includes('PermissionSet')) {
                packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-labels.xml');
            }
            await execa_1.default('sfdx', ['force:project:create', '--projectname', '.', '--json'], {
                cwd: orgretrievepath,
                env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' },
            });
            const out = JSON.parse((await execa_1.default('sfdx', ['force:source:retrieve', '--manifest', packagexml, '--targetusername', this.org.getUsername(), '--json'], { cwd: orgretrievepath, env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' } })).stdout);
            if (((_b = (_a = out === null || out === void 0 ? void 0 : out.result) === null || _a === void 0 ? void 0 : _a.inboundFiles) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                if (this.flags.metadata.includes('Profile')) {
                    inboundFiles.push(...out.result.inboundFiles.filter((x) => x.filePath.includes(path.join('force-app', 'main', 'default', 'profiles'))));
                }
                if (this.flags.metadata.includes('PermissionSet')) {
                    inboundFiles.push(...out.result.inboundFiles.filter((x) => x.filePath.includes(path.join('force-app', 'main', 'default', 'permissionsets'))));
                }
                if (this.flags.metadata.includes('CustomLabels')) {
                    inboundFiles.push(...out.result.inboundFiles.filter((x) => x.filePath.includes(path.join('force-app', 'main', 'default', 'labels'))));
                }
                await this.profileElementInjection(orgretrievepath);
                await this.shrinkPermissionSets(orgretrievepath);
                updatedfiles = await souceUtils_1.applyFixes(['source:retrieve:full'], orgretrievepath);
                inboundFiles = inboundFiles.filter((x) => fs.pathExistsSync(path.join(orgretrievepath, x.filePath)));
                const forceTargetPath = path.join(projectpath, 'force-app', 'main', 'default');
                await fs.ensureDir(forceTargetPath);
                if (this.flags.metadata.includes('Profile')) {
                    await fs.copy(path.join(orgretrievepath, 'force-app', 'main', 'default', 'profiles'), path.join(forceTargetPath, 'profiles'));
                }
                if (this.flags.metadata.includes('PermissionSet')) {
                    await fs.copy(path.join(orgretrievepath, 'force-app', 'main', 'default', 'permissionsets'), path.join(forceTargetPath, 'permissionsets'));
                }
                if (this.flags.metadata.includes('CustomLabels')) {
                    await fs.copy(path.join(orgretrievepath, 'force-app', 'main', 'default', 'labels'), path.join(forceTargetPath, 'labels'));
                }
            }
            else {
                throw new Error(out.message);
            }
            this.ux.styledHeader(chalk_1.default.blue('Retrieved Source'));
            this.ux.table(inboundFiles, {
                columns: [
                    {
                        key: 'fullName',
                        label: 'FULL NAME',
                    },
                    {
                        key: 'type',
                        label: 'TYPE',
                    },
                    {
                        key: 'filePath',
                        label: 'PROJECT PATH',
                    },
                ],
            });
            Object.keys(updatedfiles).forEach((workaround) => {
                if (updatedfiles[workaround].length > 0) {
                    this.ux.styledHeader(chalk_1.default.blue(`Fixed Source: ${workaround}`));
                    this.ux.table(updatedfiles[workaround], {
                        columns: [
                            {
                                key: 'filePath',
                                label: 'FILEPATH',
                            },
                            {
                                key: 'operation',
                                label: 'OPERATION',
                            },
                            {
                                key: 'message',
                                label: 'MESSAGE',
                            },
                        ],
                    });
                }
            });
            return {
                inboundFiles,
                fixedFiles: Object.values(updatedfiles)
                    .filter((value) => value.length > 0)
                    .reduce((acc, val) => acc.concat(val), []),
                details: updatedfiles,
            };
        }
        catch (error) {
            if (error.stdout) {
                throw new Error(JSON.parse(error.stdout).message);
            }
            else {
                throw new Error(error.message.toLowerCase());
            }
        }
        finally {
            if (!this.flags.keepcache) {
                process.once('exit', () => {
                    fs.removeSync(orgretrievepath);
                });
            }
        }
    }
}
exports.default = RetrieveProfiles;
RetrieveProfiles.description = messages.getMessage('commandDescription');
RetrieveProfiles.hidden = true;
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
RetrieveProfiles.flagsConfig = {
    keepcache: command_1.flags.boolean({
        char: 'c',
        hidden: true,
        description: messages.getMessage('keepcache'),
    }),
    metadata: command_1.flags.array({
        char: 'm',
        description: messages.getMessage('metadata'),
        options: ['Profile', 'PermissionSet', 'CustomLabels'],
        default: ['Profile', 'PermissionSet'],
    }),
    verbose: command_1.flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log'),
    }),
};
RetrieveProfiles.requiresUsername = true;
RetrieveProfiles.supportsDevhubUsername = false;
RetrieveProfiles.requiresProject = true;
//# sourceMappingURL=full.js.map