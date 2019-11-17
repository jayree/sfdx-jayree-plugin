"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@salesforce/command");
const fs = require("fs-extra");
const path = require("path");
const serialize_error_1 = require("serialize-error");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'scratchorgsettings');
function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0)
            return ''; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}
class ScratchOrgSettings extends command_1.SfdxCommand {
    async run() {
        var e_1, _a, e_2, _b;
        const removeEmpty = obj => {
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
        const sortKeys = obj => {
            const ordered = {};
            Object.keys(obj)
                .sort()
                .forEach(key => {
                ordered[key] = obj[key];
            });
            return ordered;
        };
        this.ux.startSpinner('Generating settings');
        const conn = this.org.getConnection();
        const settingsarray = (await conn.tooling.describeGlobal()).sobjects
            .filter(a => a.name.includes('Settings'))
            .map(a => a.name);
        let settings = {};
        try {
            for (var settingsarray_1 = tslib_1.__asyncValues(settingsarray), settingsarray_1_1; settingsarray_1_1 = await settingsarray_1.next(), !settingsarray_1_1.done;) {
                const member = settingsarray_1_1.value;
                try {
                    const settingsQuery = await conn.tooling.query('SELECT Metadata FROM ' + member);
                    if (typeof settingsQuery.records !== 'undefined') {
                        try {
                            for (var _c = tslib_1.__asyncValues(settingsQuery.records), _d; _d = await _c.next(), !_d.done;) {
                                const record = _d.value;
                                if (member === 'OrgPreferenceSettings') {
                                    settings[camelize(member)] = {};
                                    record['Metadata']['preferences'].forEach(element => {
                                        settings[camelize(member)][camelize(element['settingName'])] = element['settingValue'];
                                    });
                                }
                                else {
                                    settings[camelize(member)] = record['Metadata'];
                                }
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_b = _c.return)) await _b.call(_c);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                    else {
                        this.logger.error('query ' + member + ' not possible');
                    }
                }
                catch (error) {
                    if (!['INVALID_TYPE', 'EXTERNAL_OBJECT_EXCEPTION', 'INVALID_FIELD'].includes(error.name)) {
                        this.ux.error(error);
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (settingsarray_1_1 && !settingsarray_1_1.done && (_a = settingsarray_1.return)) await _a.call(settingsarray_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.ux.stopSpinner();
        // fix hard coded things
        if (typeof settings['addressSettings'] !== 'undefined') {
            delete settings['addressSettings'];
        }
        if (typeof settings['leadConvertSettings'] !== 'undefined') {
            delete settings['leadConvertSettings'];
        }
        if (typeof settings['searchSettings'] !== 'undefined') {
            delete settings['searchSettings'];
        }
        if (typeof settings['analyticsSettings'] !== 'undefined') {
            delete settings['analyticsSettings'];
        }
        if (typeof settings['activitiesSettings'] !== 'undefined') {
            if (typeof settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'] !== 'undefined') {
                delete settings['activitiesSettings']['allowUsersToRelateMultipleContactsToTasksAndEvents'];
                this.ux.warn("You can't use the Tooling API or Metadata API to enable or disable Shared Activities.To enable this feature, visit the Activity Settings page in Setup.To disable this feature, contact Salesforce.");
            }
        }
        if (typeof settings['territory2Settings'] !== 'undefined') {
            if (typeof settings['territory2Settings']['enableTerritoryManagement2'] !== 'undefined') {
                settings['territory2Settings'] = {
                    enableTerritoryManagement2: settings['territory2Settings']['enableTerritoryManagement2']
                };
            }
        }
        if (typeof settings['orgPreferenceSettings']['expandedSourceTrackingPref'] !== 'undefined') {
            delete settings['orgPreferenceSettings']['expandedSourceTrackingPref'];
        }
        if (typeof settings['orgPreferenceSettings']['scratchOrgManagementPref'] !== 'undefined') {
            delete settings['orgPreferenceSettings']['scratchOrgManagementPref'];
        }
        if (typeof settings['orgPreferenceSettings']['packaging2'] !== 'undefined') {
            delete settings['orgPreferenceSettings']['packaging2'];
        }
        if (typeof settings['orgPreferenceSettings']['compileOnDeploy'] !== 'undefined') {
            delete settings['orgPreferenceSettings']['compileOnDeploy'];
        }
        if (typeof settings['forecastingSettings'] !== 'undefined') {
            if (typeof settings['forecastingSettings']['forecastingCategoryMappings'] !== 'undefined') {
                delete settings['forecastingSettings']['forecastingCategoryMappings'];
            }
            if (typeof settings['forecastingSettings']['forecastingTypeSettings'] !== 'undefined') {
                delete settings['forecastingSettings']['forecastingTypeSettings'];
            }
        }
        if (typeof settings['caseSettings'] !== 'undefined') {
            if (typeof settings['caseSettings']['caseFeedItemSettings'] !== 'undefined') {
                if (typeof settings['caseSettings']['caseFeedItemSettings'][0] !== 'undefined') {
                    if (typeof settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] !== 'undefined') {
                        if (settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] === 'EMAIL_MESSAGE_EVENT') {
                            settings['caseSettings']['caseFeedItemSettings'][0]['feedItemType'] = 'EmailMessageEvent';
                        }
                    }
                }
            }
        }
        settings = removeEmpty(settings);
        settings = sortKeys(settings);
        settings['orgPreferenceSettings'] = sortKeys(settings['orgPreferenceSettings']);
        if (this.flags.writetoprojectscratchdeffile) {
            const deffilepath = this.flags.file || path.join(await this.project.getPath(), 'config', 'project-scratch-def.json');
            let deffile = {};
            await fs
                .readFile(deffilepath, 'utf8')
                .then(data => {
                deffile = JSON.parse(data);
                if (deffile['edition'] === 'Enterprise') {
                    if (!deffile['features'].includes('LiveAgent')) {
                        if (typeof settings['liveAgentSettings'] !== 'undefined') {
                            if (typeof settings['liveAgentSettings']['enableLiveAgent'] !== 'undefined') {
                                if (settings['liveAgentSettings']['enableLiveAgent'] === false) {
                                    delete settings['liveAgentSettings'];
                                    this.ux.warn('liveAgentSettings: Not available for deploy for this organization');
                                }
                            }
                        }
                    }
                    if (typeof settings['knowledgeSettings'] !== 'undefined') {
                        if (typeof settings['knowledgeSettings']['enableKnowledge'] !== 'undefined') {
                            if (settings['knowledgeSettings']['enableKnowledge'] === false) {
                                delete settings['knowledgeSettings'];
                                this.ux.warn("knowledgeSettings: Once enabled, Salesforce Knowledge can't be disabled.");
                            }
                        }
                    }
                    if (typeof settings['caseSettings'] !== 'undefined') {
                        if (typeof settings['caseSettings']['emailToCase'] !== 'undefined') {
                            if (typeof settings['caseSettings']['emailToCase']['enableEmailToCase'] !== 'undefined') {
                                if (settings['caseSettings']['emailToCase']['enableEmailToCase'] === false) {
                                    delete settings['caseSettings']['emailToCase'];
                                    this.ux.warn('EmailToCaseSettings: Email to case cannot be disabled once it has been enabled.');
                                }
                            }
                        }
                    }
                }
                deffile['settings'] = settings;
            })
                .catch(err => {
                if (err.code === 'ENOENT' && !this.flags.file) {
                    throw Error("default file 'project-scratch-def.json' not found, please use --file flag");
                }
                else {
                    this.throwError(err);
                }
            });
            await fs.writeFile(deffilepath, JSON.stringify(deffile, null, 2)).catch(err => {
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
exports.default = ScratchOrgSettings;
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
//# sourceMappingURL=settings.js.map