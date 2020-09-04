"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const command_1 = require("@salesforce/command");
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const chalk = tslib_1.__importStar(require("chalk"));
const shell = tslib_1.__importStar(require("shelljs"));
const sourceRetrieveBase_1 = require("../../../../sourceRetrieveBase");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefull');
class RetrieveProfiles extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        await this.org.refreshAuth();
        const json = (raw) => {
            try {
                return JSON.parse(raw).result;
            }
            catch (error) {
                return JSON.parse(raw.stderr);
            }
        };
        const projectpath = this.project.getPath();
        let inboundFiles = [];
        let updatedfiles = [];
        const orgretrievepath = path.join(projectpath, '.sfdx-jayree', 'orgs', this.org.getUsername(), `sdx_retrieveProfiles_${Date.now()}`);
        try {
            this.ux.log(`Using ${orgretrievepath}`);
            await command_1.core.fs.mkdirp(orgretrievepath, command_1.core.fs.DEFAULT_USER_DIR_MODE);
            let packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-profiles.xml');
            if (!this.flags.metadata.includes('Profile') && !this.flags.metadata.includes('PermissionSet')) {
                packagexml = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'manifest', 'package-labels.xml');
            }
            let out = json(shell.exec(`sfdx force:mdapi:retrieve --retrievetargetdir=${orgretrievepath} --unpackaged=${packagexml} --targetusername=${this.org.getUsername()} --json`, { fatal: false, silent: true, env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 }) }));
            if (out.success) {
                const zip = new adm_zip_1.default(out.zipFilePath);
                zip.extractAllTo(orgretrievepath);
                if (this.flags.metadata.includes('Profile')) {
                    out = json(shell.exec(`sfdx force:mdapi:convert --metadata=Profile --outputdir=${path.join(orgretrievepath, 'src')} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`, {
                        fatal: false,
                        silent: true,
                        env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 }),
                    }));
                    if (!out.length) {
                        throw out;
                    }
                    else {
                        out
                            .map((p) => {
                            return {
                                fullName: p.fullName,
                                type: p.type,
                                filePath: path
                                    .relative(orgretrievepath, p.filePath)
                                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                                state: 'undefined',
                            };
                        })
                            .forEach((element) => {
                            inboundFiles.push(element);
                        });
                    }
                }
                if (this.flags.metadata.includes('PermissionSet')) {
                    out = json(shell.exec(`sfdx force:mdapi:convert --metadata=PermissionSet --outputdir=${path.join(orgretrievepath, 'src')} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`, {
                        fatal: false,
                        silent: true,
                        env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 }),
                    }));
                    if (!out.length) {
                        throw out;
                    }
                    else {
                        out
                            .map((p) => {
                            return {
                                fullName: p.fullName,
                                type: p.type,
                                filePath: path
                                    .relative(orgretrievepath, p.filePath)
                                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                                state: 'undefined',
                            };
                        })
                            .forEach((element) => {
                            inboundFiles.push(element);
                        });
                    }
                }
                if (this.flags.metadata.includes('CustomLabels')) {
                    out = json(shell.exec(`sfdx force:mdapi:convert --metadata=CustomLabels --outputdir=${path.join(orgretrievepath, 'src')} --rootdir=${path.join(orgretrievepath, 'unpackaged')} --json`, {
                        fatal: false,
                        silent: true,
                        env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0, RUN_SFDX_JAYREE_HOOK: 0 }),
                    }));
                    if (!out.length) {
                        throw out;
                    }
                    else {
                        out
                            .map((p) => {
                            return {
                                fullName: p.fullName,
                                type: p.type,
                                filePath: path
                                    .relative(orgretrievepath, p.filePath)
                                    .replace(path.join('src', 'main', 'default'), path.join('force-app', 'main', 'default')),
                                state: 'undefined',
                            };
                        })
                            .forEach((element) => {
                            inboundFiles.push(element);
                        });
                    }
                }
                shell.mv(path.join(orgretrievepath, 'src'), path.join(orgretrievepath, 'force-app'));
                await this.profileElementInjection(orgretrievepath);
                const configfile = '.sfdx-jayree.json';
                let config;
                try {
                    config = require(path.join(projectpath, configfile));
                }
                catch (error) {
                    // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
                }
                updatedfiles = await this.applyfixes(config, ['source:retrieve:full'], orgretrievepath);
                const cleanedfiles = shell
                    .find(path.join(orgretrievepath, 'force-app'))
                    .filter((file) => {
                    return fs.lstatSync(file).isFile();
                })
                    .map((file) => path.relative(orgretrievepath, file));
                inboundFiles = inboundFiles.filter((x) => {
                    if (cleanedfiles.includes(x.filePath)) {
                        return x;
                    }
                });
                if (this.flags.metadata.length > 0) {
                    const forceapppath = path.join(projectpath, 'force-app');
                    shell.cp('-R', path.join(orgretrievepath, 'force-app/main'), forceapppath);
                }
            }
            else {
                throw out;
            }
        }
        finally {
            if (!this.flags.keepcache) {
                await command_1.core.fs.remove(orgretrievepath);
            }
            this.ux.styledHeader(chalk.blue('Retrieved Source'));
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
                    this.ux.styledHeader(chalk.blue(`Fixed Source: ${workaround}`));
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
        }
        return {
            inboundFiles,
            fixedFiles: Object.values(updatedfiles)
                .filter((value) => value.length > 0)
                .reduce((acc, val) => acc.concat(val), []),
            details: updatedfiles,
        };
    }
}
exports.default = RetrieveProfiles;
RetrieveProfiles.description = messages.getMessage('commandDescription');
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
        default: ['Profile', 'PermissionSet', 'CustomLabels'],
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