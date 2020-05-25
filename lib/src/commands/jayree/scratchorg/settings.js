"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
// import * as AdmZip from 'adm-zip';
// import * as chalk from 'chalk';
const createDebug = require("debug");
const fs = require("fs-extra");
const path = require("path");
const serialize_error_1 = require("serialize-error");
const shell = require("shelljs");
const xml_1 = require("../../../lib/xml");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');
function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0)
            return ''; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}
let ScratchOrgSettings = /** @class */ (() => {
    class ScratchOrgSettings extends command_1.SfdxCommand {
        async run() {
            const debug = createDebug('jayree:scratchorg:settings');
            const removeEmpty = (obj) => {
                Object.entries(obj).forEach(([key, val]) => {
                    if (val && typeof val === 'object') {
                        val = removeEmpty(val);
                    }
                    if (val === null || val === '' || (typeof val === 'object' && !Object.keys(val).length)) {
                        delete obj[key];
                    }
                });
                return obj;
            };
            const sortKeys = (obj) => {
                const ordered = {};
                Object.keys(obj)
                    .sort()
                    .forEach((key) => {
                    ordered[key] = obj[key];
                });
                return ordered;
            };
            const json = (raw) => {
                try {
                    return JSON.parse(raw).result;
                }
                catch (error) {
                    return JSON.parse(raw.stderr);
                }
            };
            const projectpath = this.project.getPath();
            let settings = {};
            const orgretrievepath = path.join(projectpath, '.sfdx-jayree', 'orgs', this.org.getUsername(), `sdx_retrieveSettings_${Date.now()}`);
            // this.ux.startSpinner('Generating settings');
            try {
                await command_1.core.fs.mkdirp(orgretrievepath, command_1.core.fs.DEFAULT_USER_DIR_MODE);
                let out = json(shell.exec(`sfdx force:project:create --projectname=. --json`, {
                    cwd: orgretrievepath,
                    fatal: false,
                    silent: true,
                    env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0 })
                }));
                let sfdxProjectVersion;
                /* istanbul ignore next*/
                try {
                    const tmpProject = await command_1.core.SfdxProject.resolve(orgretrievepath);
                    const sfdxProjectJson = await tmpProject.retrieveSfdxProjectJson();
                    sfdxProjectVersion = sfdxProjectJson.getContents().sourceApiVersion;
                }
                catch (error) { }
                const apiVersion = this.flags.apiversion || sfdxProjectVersion || (await this.org.retrieveMaxApiVersion());
                this.ux.log(`Using ${orgretrievepath} and apiVersion=${apiVersion}`);
                out = json(shell.exec(`sfdx force:source:retrieve --manifest=${path.join(__dirname, '..', '..', '..', '..', '..', 'manifest', 'package-settings.xml')} --targetusername=${this.org.getUsername()} --apiversion=${apiVersion} --json`, { cwd: orgretrievepath, fatal: false, silent: true, env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: 0 }) }));
                if (out.warnings) {
                    out.warnings.forEach((warning) => {
                        this.ux.warn(warning.problem);
                    });
                }
                if (out.inboundFiles) {
                    out.inboundFiles.forEach((element) => {
                        const filename = path.join(orgretrievepath, element.filePath);
                        const settingsXml = xml_1.parseStringSync(fs.readFileSync(filename, 'utf8'), false);
                        Object.keys(settingsXml).forEach((key) => {
                            Object.keys(settingsXml[key]).forEach((property) => {
                                if (!settings[camelize(key)]) {
                                    settings[camelize(key)] = {};
                                }
                                if (property !== '$') {
                                    settings[camelize(key)][property] = settingsXml[key][property];
                                }
                            });
                        });
                    });
                }
                else {
                    throw out;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this.flags.keepcache) {
                    await command_1.core.fs.remove(orgretrievepath);
                }
            }
            // this.ux.stopSpinner();
            // fix hard coded things
            if (typeof settings['addressSettings'] !== 'undefined') {
                delete settings['addressSettings'];
                debug('delete ' + 'addressSettings');
            }
            // if (typeof settings['leadConvertSettings'] !== 'undefined') {
            //   delete settings['leadConvertSettings'];
            //   debug('delete ' + 'leadConvertSettings');
            // }
            if (typeof settings['searchSettings'] !== 'undefined') {
                delete settings['searchSettings'];
                debug('delete ' + 'searchSettings');
            }
            if (typeof settings['analyticsSettings'] !== 'undefined') {
                delete settings['analyticsSettings'];
                debug('delete ' + 'analyticsSettings');
            }
            if (typeof settings['activitiesSettings'] !== 'undefined') {
                if (typeof settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'] !== 'undefined') {
                    delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
                    debug('delete ' + 'activitiesSettings:allowUsersToRelateMultipleContactsToTasksAndEvents');
                    this.ux.warn("You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce.");
                }
            }
            if (typeof settings['territory2Settings'] !== 'undefined') {
                if (typeof settings['territory2Settings']['enableTerritoryManagement2'] !== 'undefined') {
                    settings['territory2Settings'] = {
                        enableTerritoryManagement2: settings['territory2Settings']['enableTerritoryManagement2']
                    };
                    debug('set ' + 'enableTerritoryManagement2');
                }
            }
            // if (typeof settings['orgPreferenceSettings'] !== 'undefined') {
            //   if (typeof settings['orgPreferenceSettings']['expandedSourceTrackingPref'] !== 'undefined') {
            //     delete settings['orgPreferenceSettings']['expandedSourceTrackingPref'];
            //     debug('delete ' + 'orgPreferenceSettings:expandedSourceTrackingPref');
            //   }
            //   if (typeof settings['orgPreferenceSettings']['scratchOrgManagementPref'] !== 'undefined') {
            //     delete settings['orgPreferenceSettings']['scratchOrgManagementPref'];
            //     debug('delete ' + 'orgPreferenceSettings:scratchOrgManagementPref');
            //   }
            //   if (typeof settings['orgPreferenceSettings']['packaging2'] !== 'undefined') {
            //     delete settings['orgPreferenceSettings']['packaging2'];
            //     debug('delete ' + 'orgPreferenceSettings:packaging2');
            //   }
            //   if (typeof settings['orgPreferenceSettings']['compileOnDeploy'] !== 'undefined') {
            //     delete settings['orgPreferenceSettings']['compileOnDeploy'];
            //     debug('delete ' + 'orgPreferenceSettings:compileOnDeploy');
            //   }
            // }
            // if (typeof settings['apexSettings'] !== 'undefined') {
            //   if (typeof settings['apexSettings']['enableCompileOnDeploy'] !== 'undefined') {
            //     delete settings['apexSettings']['enableCompileOnDeploy'];
            //     debug('delete ' + 'apexSettings:enableCompileOnDeploy');
            //   }
            // }
            if (typeof settings['forecastingSettings'] !== 'undefined') {
                if (typeof settings['forecastingSettings']['forecastingCategoryMappings'] !== 'undefined') {
                    delete settings['forecastingSettings']['forecastingCategoryMappings'];
                    debug('delete ' + 'forecastingSettings:forecastingCategoryMappings');
                }
                if (typeof settings['forecastingSettings']['forecastingTypeSettings'] !== 'undefined') {
                    delete settings['forecastingSettings']['forecastingTypeSettings'];
                    debug('delete ' + 'forecastingSettings:forecastingTypeSettings');
                }
            }
            if (typeof settings['caseSettings'] !== 'undefined') {
                if (typeof settings['caseSettings']['caseFeedItemSettings'] !== 'undefined') {
                    if (typeof settings['caseSettings']['caseFeedItemSettings'][0] !== 'undefined') {
                        if (typeof settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] !== 'undefined') {
                            if (settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] === 'EMAIL_MESSAGE_EVENT') {
                                settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] = 'EmailMessageEvent';
                                debug('set ' + 'caseSettings:caseFeedItemSettings:feedItemType');
                            }
                        }
                    }
                }
            }
            settings = removeEmpty(settings);
            settings = sortKeys(settings);
            // if (typeof settings['orgPreferenceSettings'] !== 'undefined') {
            //   settings['orgPreferenceSettings'] = sortKeys(settings['orgPreferenceSettings']);
            // }
            if (this.flags.writetoprojectscratchdeffile) {
                const deffilepath = this.flags.file || path.join(await this.project.getPath(), 'config', 'project-scratch-def.json');
                let deffile = {};
                await fs
                    .readFile(deffilepath, 'utf8')
                    .then((data) => {
                    deffile = JSON.parse(data);
                    if (deffile['edition'] === 'Enterprise') {
                        if (!deffile['features'].includes('LiveAgent')) {
                            if (typeof settings['liveAgentSettings'] !== 'undefined') {
                                if (typeof settings['liveAgentSettings']['enableLiveAgent'] !== 'undefined') {
                                    if (settings['liveAgentSettings']['enableLiveAgent'] === 'false') {
                                        delete settings['liveAgentSettings'];
                                        debug('delete ' + 'liveAgentSettings');
                                        this.ux.warn('liveAgentSettings: Not available for deploy for this organization');
                                    }
                                }
                            }
                        }
                        if (typeof settings['knowledgeSettings'] !== 'undefined') {
                            if (typeof settings['knowledgeSettings']['enableKnowledge'] !== 'undefined') {
                                if (settings['knowledgeSettings']['enableKnowledge'] === 'false') {
                                    delete settings['knowledgeSettings'];
                                    debug('delete ' + 'knowledgeSettings');
                                    this.ux.warn("knowledgeSettings: Once enabled, Salesforce Knowledge can't be disabled.");
                                }
                            }
                        }
                        if (typeof settings['caseSettings'] !== 'undefined') {
                            if (typeof settings['caseSettings']['emailToCase'] !== 'undefined') {
                                if (typeof settings['caseSettings']['emailToCase']['enableEmailToCase'] !== 'undefined') {
                                    if (settings['caseSettings']['emailToCase']['enableEmailToCase'] === 'false') {
                                        delete settings['caseSettings']['emailToCase'];
                                        debug('delete ' + 'caseSettings:emailToCase');
                                        this.ux.warn('EmailToCaseSettings: Email to case cannot be disabled once it has been enabled.');
                                    }
                                }
                            }
                        }
                    }
                    deffile['settings'] = settings;
                })
                    .catch((err) => {
                    if (err.code === 'ENOENT' && !this.flags.file) {
                        throw Error("default file 'project-scratch-def.json' not found, please use --file flag");
                    }
                    else {
                        this.throwError(err);
                    }
                });
                await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2)).catch((err) => {
                    this.throwError(err);
                });
            }
            else {
                this.ux.styledHeader('received settings from Org: ' + this.org.getUsername() + ' (' + this.org.getOrgId() + ')');
                this.ux.styledJSON(settings);
            }
            return {
                settings,
                orgId: this.org.getOrgId(),
                username: this.org.getUsername()
            };
        }
        throwError(err) {
            this.ux.stopSpinner();
            this.logger.error({ err: serialize_error_1.serializeError(err) });
            throw err;
        }
    }
    ScratchOrgSettings.description = messages.getMessage('commandDescription');
    ScratchOrgSettings.examples = [
        `$ sfdx jayree:scratchorgsettings
$ sfdx jayree:scratchorgsettings -u me@my.org
$ sfdx jayree:scratchorgsettings -u MyTestOrg1 -w`
    ];
    ScratchOrgSettings.flagsConfig = {
        writetoprojectscratchdeffile: command_1.flags.boolean({
            char: 'w',
            description: messages.getMessage('writetoprojectscratchdeffile')
        }),
        file: command_1.flags.string({
            char: 'f',
            description: messages.getMessage('fileFlagDescription')
        })
    };
    ScratchOrgSettings.requiresUsername = true;
    ScratchOrgSettings.supportsDevhubUsername = false;
    ScratchOrgSettings.requiresProject = true;
    return ScratchOrgSettings;
})();
exports.default = ScratchOrgSettings;
//# sourceMappingURL=settings.js.map