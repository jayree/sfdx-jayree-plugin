"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const AdmZip = require("adm-zip");
const chalk = require("chalk");
const path = require("path");
const shell = require("shelljs");
const sourceRetrieveBase_1 = require("../../../../sourceRetrieveBase");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'sourceretrieveall');
class RetrieveMetadata extends sourceRetrieveBase_1.SourceRetrieveBase {
    async run() {
        await this.org.refreshAuth();
        const json = raw => {
            try {
                return JSON.parse(raw).result;
            }
            catch (error) {
                return JSON.parse(raw.stderr);
            }
        };
        const projectpath = this.project.getPath();
        let inboundFiles = [];
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
            this.ux.log(`Using ${orgretrievepath}`);
            await command_1.core.fs.mkdirp(orgretrievepath, command_1.core.fs.DEFAULT_USER_DIR_MODE);
            let out = shell.exec(`sfdx jayree:packagexml --excludemanaged --file=${path.join(orgretrievepath, 'package.xml')} --targetusername=${this.org.getUsername()} --json`, { cwd: orgretrievepath, fatal: false, silent: true });
            if (config) {
                if (config['source:retrieve:all']) {
                    if (config['source:retrieve:all'].manifestignore) {
                        await this.cleanuppackagexml(path.join(orgretrievepath, 'package.xml'), config['source:retrieve:all'].manifestignore, projectpath);
                    }
                }
            }
            out = json(shell.exec(`sfdx force:mdapi:retrieve --retrievetargetdir=. --unpackaged=${path.join(orgretrievepath, 'package.xml')} --targetusername=${this.org.getUsername()} --json`, { cwd: orgretrievepath, fatal: false, silent: true }));
            if (out.success) {
                const zip = new AdmZip(out.zipFilePath);
                zip.extractAllTo(orgretrievepath);
                out = json(shell.exec(`sfdx force:mdapi:convert --outputdir=./src --rootdir=./unpackaged --json`, {
                    cwd: orgretrievepath,
                    fatal: false,
                    silent: true
                }));
                if (!out.length) {
                    throw new Error('Metadata conversion failed');
                }
                else {
                    out
                        .map(p => {
                        return {
                            fullName: p.fullName,
                            type: p.type,
                            filePath: path
                                .relative(orgretrievepath, p.filePath)
                                .replace('src/main/default/', 'force-app/main/default/'),
                            state: 'undefined'
                        };
                    })
                        .forEach(element => {
                        inboundFiles.push(element);
                    });
                }
                shell.mv(path.join(orgretrievepath, 'src'), path.join(orgretrievepath, 'force-app'));
                if (config) {
                    if (config['source:retrieve:all']) {
                        config = config['source:retrieve:all'];
                        for (const workarounds of Object.keys(config)) {
                            for (const workaround of Object.keys(config[workarounds])) {
                                if (config[workarounds][workaround].isactive === true) {
                                    if (config[workarounds][workaround].files) {
                                        this.log("'" + workaround + "'");
                                        if (config[workarounds][workaround].files.delete) {
                                            await this.sourcedelete(config[workarounds][workaround].files.delete, orgretrievepath);
                                        }
                                        if (config[workarounds][workaround].files.modify) {
                                            await this.sourcefix(config[workarounds][workaround].files.modify, orgretrievepath, this.org.getConnection());
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        /* this.ux.warn(
                              `Root object 'source:retrieve:full' missing in config file '${configfile}' - SKIPPING metadata fixes`
                            ); */
                    }
                }
                const cleanedfiles = shell
                    .find(path.join(orgretrievepath, 'force-app'))
                    .filter(file => {
                    return file.match(/\.xml$/);
                })
                    .map(file => path.relative(orgretrievepath, file));
                inboundFiles = inboundFiles.filter(x => {
                    if (cleanedfiles.includes(x.filePath)) {
                        return x;
                    }
                });
                const forceapppath = path.join(projectpath, 'force-app');
                shell.cp('-R', `${orgretrievepath}/force-app/main`, forceapppath);
            }
            else {
                throw new Error(out.message);
            }
        }
        catch (error) {
            throw error;
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
                        label: 'FULL NAME'
                    },
                    {
                        key: 'type',
                        label: 'TYPE'
                    },
                    {
                        key: 'filePath',
                        label: 'PROJECT PATH'
                    }
                ]
            });
        }
        return {
            inboundFiles
        };
    }
}
exports.default = RetrieveMetadata;
RetrieveMetadata.description = messages.getMessage('commandDescription');
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
        description: messages.getMessage('keepcache')
    }),
    verbose: command_1.flags.builtin({
        description: messages.getMessage('log'),
        longDescription: messages.getMessage('log')
    })
};
RetrieveMetadata.requiresUsername = true;
RetrieveMetadata.supportsDevhubUsername = false;
RetrieveMetadata.requiresProject = true;
//# sourceMappingURL=all.js.map