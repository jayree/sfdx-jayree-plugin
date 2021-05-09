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
const sourceRetrieveBase_1 = require("../../../../sourceRetrieveBase");
const souceUtils_1 = require("../../../../utils/souceUtils");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrieveall');
class RetrieveMetadata extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        var _a, _b;
        await this.org.refreshAuth();
        const projectpath = this.project.getPath();
        let inboundFiles = [];
        let updatedfiles = {};
        const orgretrievepath = path.join(projectpath, '.sfdx-jayree', 'orgs', this.org.getUsername(), `sdx_retrieveMetadata_${Date.now()}`);
        try {
            const configfile = '.sfdx-jayree.json';
            let config;
            try {
                config = require(path.join(projectpath, configfile));
            }
            catch (error) {
                // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
            }
            await fs.mkdirp(orgretrievepath);
            if (typeof config['source:retrieve:all'].manifestignore === 'object') {
                if (typeof config['source:retrieve:all'].manifestignore.default === 'undefined') {
                    if (typeof this.flags.scope === 'undefined') {
                        throw Error(`Missing required flag:
 -s, --scope SCOPE  config scope to use
See more help with --help`);
                    }
                    else {
                        if (typeof config['source:retrieve:all'].manifestignore[this.flags.scope] === 'undefined') {
                            throw Error(`Scope ${this.flags.scope} not found`);
                        }
                    }
                }
            }
            this.ux.log(`Using ${orgretrievepath}`);
            let packageXMLFile = path.join(orgretrievepath, 'package.xml');
            if (config) {
                if (config['source:retrieve:all']) {
                    if (config['source:retrieve:all'].manifest) {
                        packageXMLFile = path.join(projectpath, this.getScopedValue(config['source:retrieve:all'].manifest));
                    }
                }
            }
            await execa_1.default('sfdx', [
                'jayree:packagexml',
                '--excludemanaged',
                '--file',
                packageXMLFile,
                '--targetusername',
                this.org.getUsername(),
                '--json',
            ], { env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' } });
            if (config) {
                if (config['source:retrieve:all']) {
                    if (config['source:retrieve:all'].manifestignore) {
                        await this.cleanuppackagexml(packageXMLFile, this.getScopedValue(config['source:retrieve:all'].manifestignore), projectpath);
                    }
                }
            }
            await execa_1.default('sfdx', ['force:project:create', '--projectname', '.', '--json'], {
                cwd: orgretrievepath,
                env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' },
            });
            const out = JSON.parse((await execa_1.default('sfdx', [
                'force:source:retrieve',
                '--manifest',
                packageXMLFile,
                '--targetusername',
                this.org.getUsername(),
                '--json',
            ], { cwd: orgretrievepath, env: { FORCE_COLOR: '0', SFDX_DISABLE_JAYREE_HOOKS: 'true' } })).stdout);
            if (((_b = (_a = out === null || out === void 0 ? void 0 : out.result) === null || _a === void 0 ? void 0 : _a.inboundFiles) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                inboundFiles = out.result.inboundFiles;
                await this.profileElementInjection(orgretrievepath);
                await this.shrinkPermissionSets(orgretrievepath);
                if (!this.flags.skipfix) {
                    updatedfiles = await souceUtils_1.applyFixes(['source:retrieve:full', 'source:retrieve:all'], orgretrievepath);
                }
                inboundFiles = inboundFiles.filter((x) => fs.pathExistsSync(path.join(orgretrievepath, x.filePath)));
                const forceapppath = path.join(projectpath, 'force-app');
                await fs.copy(path.join(orgretrievepath, 'force-app'), forceapppath);
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
            // eslint-disable-next-line no-useless-catch
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
exports.default = RetrieveMetadata;
RetrieveMetadata.description = messages.getMessage('commandDescription');
RetrieveMetadata.hidden = true;
/*   public static examples = [
  `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
]; */
RetrieveMetadata.flagsConfig = {
    keepcache: command_1.flags.boolean({
        char: 'c',
        hidden: true,
        description: messages.getMessage('keepcache'),
    }),
    skipfix: command_1.flags.boolean({
        hidden: true,
        description: messages.getMessage('keepcache'),
    }),
    verbose: command_1.flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log'),
    }),
    scope: command_1.flags.string({
        char: 's',
        description: messages.getMessage('scope'),
    }),
};
RetrieveMetadata.requiresUsername = true;
RetrieveMetadata.supportsDevhubUsername = false;
RetrieveMetadata.requiresProject = true;
//# sourceMappingURL=all.js.map