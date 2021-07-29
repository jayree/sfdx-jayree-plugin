"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfiles = exports.applySourceFixes = exports.applyFixes = exports.getConnectionFromArgv = exports.logFixes = exports.profileElementInjection = exports.shrinkPermissionSets = exports.getProjectPath = exports.debug = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path = tslib_1.__importStar(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const fs = tslib_1.__importStar(require("fs-extra"));
const core_1 = require("@salesforce/core");
const kit = tslib_1.__importStar(require("@salesforce/kit"));
const cli_ux_1 = tslib_1.__importDefault(require("cli-ux"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const core_2 = require("@salesforce/core");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const xml_1 = require("../utils/xml");
const config_1 = tslib_1.__importDefault(require("./config"));
const object_path_1 = require("./object-path");
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON');
function arrayEquals(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((u, i) => u === arr2[i]);
}
function compareobj(obj1, obj2) {
    return arrayEquals(!Array.isArray(obj2) ? [obj2] : obj2, !Array.isArray(obj1) ? [obj1] : obj1);
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
exports.debug = require('debug')('jayree:source');
let argvConnection = { username: null, instanceUrl: null };
let projectPath = '';
async function getProjectPath() {
    if (projectPath.length > 0) {
        return projectPath;
    }
    try {
        projectPath = (await core_1.SfdxProject.resolveProjectPath()).split(path.sep).join(path.posix.sep);
        return projectPath;
    }
    catch (error) {
        return undefined;
    }
}
exports.getProjectPath = getProjectPath;
async function shrinkPermissionSets(permissionsets) {
    for (const file of permissionsets) {
        if (await fs.pathExists(file)) {
            const data = xml_1.parseSourceComponent(await fs.readFile(file, 'utf8'));
            const mutingOrPermissionSet = Object.keys(data)[0];
            const fieldPermissions = xml_1.normalizeToArray(data[mutingOrPermissionSet].fieldPermissions);
            if (fieldPermissions) {
                exports.debug({
                    [mutingOrPermissionSet]: file,
                    removedFieldPermsissions: JSON.stringify(fieldPermissions.filter((el) => el.editable.toString() === 'false' && el.readable.toString() === 'false')),
                });
                data[mutingOrPermissionSet].fieldPermissions = fieldPermissions.filter((el) => el.editable.toString() === 'true' || el.readable.toString() === 'true');
                fs.writeFileSync(file, xml_1.js2SourceComponent(data));
            }
        }
    }
}
exports.shrinkPermissionSets = shrinkPermissionSets;
async function profileElementInjection(profiles, customObjectsFilter = []) {
    const ensureUserPermissions = config_1.default(await getProjectPath()).ensureUserPermissions;
    let ensureObjectPermissions = config_1.default(await getProjectPath()).ensureObjectPermissions;
    if (customObjectsFilter.length) {
        ensureObjectPermissions = ensureObjectPermissions.filter((el) => customObjectsFilter.includes(el));
    }
    if (ensureObjectPermissions.length === 0) {
        process.once('exit', () => {
            cli_ux_1.default.warn('no ensureObjectPermissions list configured');
        });
    }
    for (const file of profiles) {
        if (await fs.pathExists(file)) {
            const data = xml_1.parseSourceComponent(await fs.readFile(file, 'utf8'));
            if (data.Profile.custom === 'true') {
                const objectPermissions = xml_1.normalizeToArray(data.Profile['objectPermissions']);
                const injectedObjectPermission = [];
                ensureObjectPermissions.forEach((object) => {
                    if (objectPermissions && !objectPermissions.some((e) => compareobj(e.object, object))) {
                        injectedObjectPermission.push({
                            allowCreate: ['false'],
                            allowDelete: ['false'],
                            allowEdit: ['false'],
                            allowRead: ['false'],
                            modifyAllRecords: ['false'],
                            object: [object],
                            viewAllRecords: ['false'],
                        });
                    }
                });
                data.Profile['objectPermissions'] = objectPermissions.concat(injectedObjectPermission);
                const userPermissions = xml_1.normalizeToArray(data.Profile['userPermissions']);
                const injectedUserPermission = [];
                ensureUserPermissions.forEach((name) => {
                    if (userPermissions && !userPermissions.some((e) => compareobj(e.name, name))) {
                        injectedUserPermission.push({ enabled: ['false'], name: [name] });
                    }
                });
                data.Profile['userPermissions'] = userPermissions.concat(injectedUserPermission);
                if (data.Profile.objectPermissions) {
                    data.Profile.objectPermissions.sort((a, b) => (a.object > b.object ? 1 : -1));
                }
                if (data.Profile.userPermissions) {
                    data.Profile.userPermissions.sort((a, b) => (a.name > b.name ? 1 : -1));
                }
                data.Profile = Object.keys(data.Profile)
                    .sort()
                    .reduce((acc, key) => {
                    acc[key] = data.Profile[key];
                    return acc;
                }, {});
                fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                exports.debug({
                    profile: file,
                    injectedObjectPermission: JSON.stringify(injectedObjectPermission),
                    injectedUserPermission: JSON.stringify(injectedUserPermission),
                });
            }
        }
    }
}
exports.profileElementInjection = profileElementInjection;
async function logFixes(updatedfiles) {
    if (isOutputEnabled) {
        const root = await getProjectPath();
        Object.keys(updatedfiles).forEach((workaround) => {
            if (updatedfiles[workaround].length > 0) {
                cli_ux_1.default.styledHeader(chalk_1.default.blue(`Fixed Source: ${workaround}`));
                cli_ux_1.default.table(updatedfiles[workaround], {
                    filePath: {
                        header: 'FILEPATH',
                        get: (row) => path.relative(root, row.filePath),
                    },
                    operation: {
                        header: 'OPERATION',
                    },
                    message: {
                        header: 'MESSAGE',
                    },
                });
            }
        });
    }
}
exports.logFixes = logFixes;
async function getGlobbyBaseDirectory(globbypath) {
    try {
        (await fs.lstat(globbypath)).isDirectory();
        return globbypath;
    }
    catch (error) {
        return await getGlobbyBaseDirectory(path.dirname(globbypath));
    }
}
async function sourcemove(movesources, root, filter) {
    const array = [];
    for (const filepath of movesources) {
        let files = await globby_1.default(path.posix.join(root.split(path.sep).join(path.posix.sep), filepath[0]));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        const from = await getGlobbyBaseDirectory(filepath[0]);
        for (const file of files) {
            if (await fs.pathExists(file)) {
                const destinationFile = path.join(filepath[1], path.relative(from, file));
                exports.debug(`move file: ${file} to ${destinationFile}`);
                await fs.ensureDir(path.dirname(destinationFile));
                await fs.rename(file, destinationFile);
                array.push({ filePath: file, operation: 'moveFile', message: destinationFile });
            }
            else {
                exports.debug(`${filepath} not found`);
            }
        }
    }
    return array;
}
async function sourcedelete(deletesources, root, filter) {
    const array = [];
    for (const filepath of deletesources) {
        let files = await globby_1.default(path.posix.join(root.split(path.sep).join(path.posix.sep), filepath));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        for (const file of files) {
            if (await fs.pathExists(file)) {
                exports.debug(`delete file: ${file}`);
                await fs.remove(file);
                array.push({ filePath: file, operation: 'deleteFile', message: '' });
            }
            else {
                exports.debug(`${file} not found`);
            }
        }
    }
    return array;
}
async function getConnectionFromArgv() {
    if (Object.values(argvConnection).some((x) => x !== null && x !== '')) {
        return new Promise((resolve) => {
            resolve(argvConnection);
        });
    }
    const argv = [...process.argv];
    let aliasOrUsername = '';
    while (argv.length && aliasOrUsername.length === 0) {
        const input = argv.shift();
        if (input.startsWith('-u') || input.startsWith('--targetusername')) {
            const i = input.indexOf('=');
            if (i !== -1) {
                aliasOrUsername = input.slice(i + 1, input.length);
            }
            else {
                aliasOrUsername = argv.shift();
            }
        }
    }
    if (aliasOrUsername.length === 0) {
        try {
            const aggregator = await core_2.ConfigAggregator.create();
            aliasOrUsername = aggregator.getPropertyValue('defaultusername').toString();
        }
        catch {
            throw new Error('This command requires a username to apply <mydomain> or <username>. Specify it with the -u parameter or with the "sfdx config:set defaultusername=<username>" command.');
        }
    }
    const org = await core_2.Org.create({ aliasOrUsername });
    argvConnection = { instanceUrl: org.getConnection().instanceUrl, username: org.getConnection().getUsername() };
    return argvConnection;
}
exports.getConnectionFromArgv = getConnectionFromArgv;
// eslint-disable-next-line complexity
async function sourcefix(fixsources, root, filter) {
    const array = [];
    for (const filename of Object.keys(fixsources)) {
        let files = await globby_1.default(path.posix.join(root.split(path.sep).join(path.posix.sep), filename));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        for (const file of files) {
            if (await fs.pathExists(file)) {
                const data = xml_1.parseSourceComponent(await fs.readFile(file, 'utf8'));
                exports.debug(`modify file: ${file}`);
                if (fixsources[filename].delete) {
                    for (const deltask of fixsources[filename].delete) {
                        const deltaskpaths = new object_path_1.ObjectPathResolver(data).resolveString(deltask).value();
                        for (const deltaskpath of deltaskpaths.reverse()) {
                            if (typeof deltaskpath !== 'undefined') {
                                exports.debug(`delete: ${deltaskpath}`);
                                object_path_1.objectPath.del(data, deltaskpath);
                                fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                array.push({
                                    filePath: file,
                                    operation: 'delete',
                                    message: deltask,
                                });
                            }
                            else {
                                exports.debug(`delete: '${deltask.path} not found`);
                            }
                        }
                    }
                }
                if (fixsources[filename].insert) {
                    for (const inserttask of fixsources[filename].insert) {
                        if (inserttask.object) {
                            const inserttaskpaths = new object_path_1.ObjectPathResolver(data).resolveString(inserttask.path).value();
                            if (inserttaskpaths.length > 0) {
                                let match = '';
                                for (const inserttaskpath of inserttaskpaths) {
                                    if (typeof inserttaskpath !== 'undefined') {
                                        if (JSON.stringify(object_path_1.objectPath.get(data, inserttaskpath)).includes(JSON.stringify(inserttask.object).replace('{', '').replace('}', ''))) {
                                            match = inserttaskpath;
                                        }
                                    }
                                }
                                if (!match) {
                                    const lastItem = inserttaskpaths.pop();
                                    const index = lastItem.split('.').pop();
                                    let inserttaskpath;
                                    if (Number(index)) {
                                        inserttaskpath = lastItem.split('.').slice(0, -1).join('.');
                                        exports.debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttaskpath}`);
                                        object_path_1.objectPath.insert(data, inserttaskpath, inserttask.object, inserttask.at);
                                    }
                                    else {
                                        inserttaskpath = lastItem;
                                        exports.debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttaskpath}`);
                                        Object.keys(inserttask.object).forEach((key) => {
                                            object_path_1.objectPath.set(data, `${inserttaskpath}.${key}`, inserttask.object[key]);
                                        });
                                    }
                                    fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                    array.push({
                                        filePath: file,
                                        operation: 'insert',
                                        message: `${JSON.stringify(inserttask.object)} at ${inserttaskpath}`,
                                    });
                                }
                                else {
                                    exports.debug(`insert: Object ${JSON.stringify(inserttask.object)} found at ${match}`);
                                }
                            }
                        }
                    }
                }
                if (fixsources[filename].set) {
                    for (const settask of fixsources[filename].set) {
                        const settaskpaths = new object_path_1.ObjectPathResolver(data).resolveString(settask.path).value();
                        if (settaskpaths.length > 0) {
                            for (const settaskpath of settaskpaths) {
                                if (typeof settaskpath !== 'undefined') {
                                    if (settask.value) {
                                        if (JSON.stringify(settask.value).includes('<mydomain>')) {
                                            settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<mydomain>/i, (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[0]));
                                        }
                                        if (JSON.stringify(settask.value).includes('<instance>')) {
                                            settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<instance>/i, (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[1]));
                                        }
                                        if (JSON.stringify(settask.value).includes('<username>')) {
                                            settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<username>/i, (await getConnectionFromArgv()).username));
                                        }
                                    }
                                    if (settask.value && !compareobj(object_path_1.objectPath.get(data, settaskpath), settask.value)) {
                                        exports.debug(`Set: ${JSON.stringify(settask.value)} at ${settaskpath}`);
                                        object_path_1.objectPath.set(data, settaskpath, `${settask.value}`);
                                        fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                        array.push({
                                            filePath: file,
                                            operation: 'set',
                                            message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                                        });
                                    }
                                    else {
                                        exports.debug(`Set: value ${JSON.stringify(settask.value)} found at ${settaskpath}`);
                                    }
                                    if (settask.object) {
                                        const validate = async (node) => {
                                            const replaceArray = [];
                                            const recursive = (n, attpath) => {
                                                // eslint-disable-next-line guard-for-in
                                                for (const attributename in n) {
                                                    if (attpath.length === 0) {
                                                        attpath = attributename;
                                                    }
                                                    else {
                                                        attpath = attpath + '.' + attributename;
                                                    }
                                                    if (typeof n[attributename] === 'object') {
                                                        recursive(n[attributename], attpath);
                                                    }
                                                    else {
                                                        if (n[attributename] === '<username>') {
                                                            replaceArray.push([n[attributename], attpath]);
                                                        }
                                                    }
                                                }
                                            };
                                            recursive(node, '');
                                            for (const element of replaceArray) {
                                                if (element[0] === '<username>') {
                                                    object_path_1.objectPath.set(node, element[1], (await getConnectionFromArgv()).username);
                                                }
                                            }
                                            return node;
                                        };
                                        settask.object = await validate(settask.object);
                                    }
                                    const checkequal = (x, y) => {
                                        let equal = true;
                                        Object.keys(x).forEach((key) => {
                                            if (!compareobj(x[key], y[key])) {
                                                equal = false;
                                            }
                                        });
                                        return equal;
                                    };
                                    if (settask.object && !checkequal(settask.object, object_path_1.objectPath.get(data, settaskpath))) {
                                        exports.debug(`set: ${JSON.stringify(settask.object)} at ${settaskpath}`);
                                        if (settask.object) {
                                            let modifiedPath = '';
                                            for (const k of Object.keys(settask.object)) {
                                                exports.debug(settaskpath + '.' + k);
                                                if (object_path_1.objectPath.has(data, settaskpath + '.' + k)) {
                                                    exports.debug(settask.object[k]);
                                                    if (!compareobj(object_path_1.objectPath.get(data, settaskpath + '.' + k), settask.object[k])) {
                                                        modifiedPath = settaskpath;
                                                        object_path_1.objectPath.set(data, settaskpath + '.' + k, settask.object[k]);
                                                        exports.debug({ modifiedPath });
                                                    }
                                                    exports.debug(object_path_1.objectPath.get(data, settaskpath));
                                                }
                                            }
                                            if (modifiedPath) {
                                                fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                                array.push({
                                                    filePath: file,
                                                    operation: 'set',
                                                    message: `${modifiedPath} ==> ${JSON.stringify(settask.object)}`,
                                                });
                                            }
                                        }
                                    }
                                    else {
                                        exports.debug(`Set: value ${JSON.stringify(settask.object)} found at ${settaskpath}`);
                                    }
                                }
                            }
                        }
                        else {
                            if (settask.value) {
                                exports.debug(`Set: ${JSON.stringify(settask.value)} at ${settask.path}`);
                                if (object_path_1.objectPath.has(data, settask.path)) {
                                    object_path_1.objectPath.set(data, settask.path, `${settask.value}`);
                                    fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                    array.push({
                                        filePath: file,
                                        operation: 'set',
                                        message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                                    });
                                }
                            }
                            else if (typeof settask.object === 'object') {
                                object_path_1.objectPath.set(data, settask.path + '.0', settask.object);
                                exports.debug(object_path_1.objectPath.get(data, settask.path));
                                fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                                array.push({
                                    filePath: file,
                                    operation: 'set',
                                    message: `${settask.path} ==> ${JSON.stringify(settask.object)}`,
                                });
                            }
                        }
                    }
                }
                if (fixsources[filename].fixflowtranslation) {
                    const flowDefinitions = object_path_1.objectPath.get(data, 'Translations.flowDefinitions');
                    for (const flowDefinition of flowDefinitions) {
                        const fullname = object_path_1.objectPath.get(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`);
                        if (fullname.lastIndexOf('-') > 0) {
                            exports.debug(`fixflowtranslation: ${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))}`);
                            object_path_1.objectPath.set(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`, fullname.substring(0, fullname.lastIndexOf('-')));
                            fs.writeFileSync(file, xml_1.js2SourceComponent(data));
                            array.push({
                                filePath: file,
                                operation: 'fix',
                                message: `(${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))})`,
                            });
                        }
                        else {
                            exports.debug(`fixflowtranslation: ${fullname} already fixed`);
                        }
                    }
                }
            }
            else {
                exports.debug(`modify file: ${file} not found`);
            }
        }
    }
    return array;
}
// eslint-disable-next-line complexity
async function applyFixes(tags, root, filter = []) {
    if (!root) {
        root = await getProjectPath();
    }
    const configPath = await core_1.fs.traverseForFile(process.cwd(), '.sfdx-jayree.json');
    const updatedfiles = {};
    for (const tag of tags) {
        const fix = config_1.default(configPath)[tag];
        if (fix) {
            let result = [];
            for (const workarounds of Object.keys(fix)) {
                for (const workaround of Object.keys(fix[workarounds])) {
                    if (fix[workarounds][workaround].isactive === true &&
                        fix[workarounds][workaround].files &&
                        fix[workarounds][workaround].files.move) {
                        if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                            updatedfiles[workarounds + '/' + workaround] = [];
                        }
                        result = result.concat(await sourcemove(fix[workarounds][workaround].files.move, root, filter));
                        updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(result);
                    }
                }
            }
            result.forEach((element) => {
                const index = filter.findIndex((p) => p === element.filePath);
                filter[index] = path.join(root, element.message);
            });
        }
    }
    for (const tag of tags) {
        const fix = config_1.default(configPath)[tag];
        if (fix) {
            for (const workarounds of Object.keys(fix)) {
                for (const workaround of Object.keys(fix[workarounds])) {
                    if (fix[workarounds][workaround].isactive === true &&
                        fix[workarounds][workaround].files &&
                        fix[workarounds][workaround].files.modify) {
                        if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                            updatedfiles[workarounds + '/' + workaround] = [];
                        }
                        updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(await sourcefix(fix[workarounds][workaround].files.modify, root, filter));
                    }
                }
            }
        }
    }
    for (const tag of tags) {
        const fix = config_1.default(configPath)[tag];
        if (fix) {
            for (const workarounds of Object.keys(fix)) {
                for (const workaround of Object.keys(fix[workarounds])) {
                    if (fix[workarounds][workaround].isactive === true &&
                        fix[workarounds][workaround].files &&
                        fix[workarounds][workaround].files.delete) {
                        if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                            updatedfiles[workarounds + '/' + workaround] = [];
                        }
                        updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(await sourcedelete(fix[workarounds][workaround].files.delete, root, filter));
                    }
                }
            }
        }
    }
    return updatedfiles;
}
exports.applyFixes = applyFixes;
async function applySourceFixes(filter) {
    return await applyFixes(config_1.default(await getProjectPath()).applySourceFixes, null, filter);
}
exports.applySourceFixes = applySourceFixes;
async function updateProfiles(profiles, customObjects, forceSourcePull) {
    if (forceSourcePull) {
        exports.debug('force:source:pull detected');
        const targetDir = process.env.SFDX_MDAPI_TEMP_DIR || os_1.default.tmpdir();
        const destRoot = path.join(targetDir, 'reRetrieveProfiles');
        exports.debug({ destRoot });
        const ComponentSetArray = [
            { fullName: '*', type: 'ApexClass' },
            { fullName: '*', type: 'ApexPage' },
            { fullName: '*', type: 'Community' },
            { fullName: '*', type: 'CustomApplication' },
            { fullName: '*', type: 'CustomObject' },
            { fullName: '*', type: 'CustomPermission' },
            { fullName: '*', type: 'CustomTab' },
            { fullName: '*', type: 'DataCategoryGroup' },
            { fullName: '*', type: 'ExternalDataSource' },
            { fullName: '*', type: 'Flow' },
            { fullName: '*', type: 'Layout' },
            { fullName: '*', type: 'NamedCredential' },
            { fullName: '*', type: 'Profile' },
            { fullName: '*', type: 'ProfilePasswordPolicy' },
            { fullName: '*', type: 'ProfileSessionSetting' },
            { fullName: '*', type: 'ServicePresenceStatus' },
        ];
        config_1.default(await getProjectPath()).ensureObjectPermissions.forEach((fullName) => {
            ComponentSetArray.push({ fullName, type: 'CustomObject' });
        });
        const componentSet = new source_deploy_retrieve_1.ComponentSet(ComponentSetArray);
        const mdapiRetrieve = await componentSet.retrieve({
            usernameOrConnection: (await getConnectionFromArgv()).username,
            output: destRoot,
        });
        const retrieveResult = await mdapiRetrieve.pollStatus(1000);
        customObjects = retrieveResult.getFileResponses().filter((el) => el.type === 'CustomObject');
        for (const retrieveProfile of retrieveResult
            .getFileResponses()
            .filter((component) => component.type === 'Profile')) {
            const index = profiles.findIndex((profile) => profile.fullName === retrieveProfile.fullName);
            if (index >= 0) {
                await fs.rename(retrieveProfile.filePath, profiles[index].filePath);
            }
        }
        await fs.remove(destRoot);
    }
    let customObjectsFilter = [];
    if (customObjects.length) {
        customObjectsFilter = customObjects.map((el) => el.fullName).filter(Boolean);
    }
    exports.debug({ profiles, customObjectsFilter });
    await profileElementInjection(profiles.map((profile) => profile.filePath).filter(Boolean), customObjectsFilter);
}
exports.updateProfiles = updateProfiles;
//# sourceMappingURL=souceUtils.js.map