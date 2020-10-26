"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfiles = exports.applyFixes = exports.applySourceFixes = exports.logMoves = exports.logFixes = exports.moveSourceFilesByFolder = exports.profileElementInjection = exports.shrinkPermissionSets = exports.debug = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// import * as util from 'util';
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs-extra"));
const xml2js = tslib_1.__importStar(require("xml2js"));
const core_1 = require("@salesforce/core");
const kit = tslib_1.__importStar(require("@salesforce/kit"));
const cli_ux_1 = tslib_1.__importDefault(require("cli-ux"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const core_2 = require("@salesforce/core");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const execa = require("execa");
const slash_1 = tslib_1.__importDefault(require("slash"));
const config_1 = tslib_1.__importDefault(require("./config"));
const object_path_1 = require("./object-path");
// const parseStringPromise = util.promisify(xml2js.parseString);
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON');
const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    xmlns: true,
    renderOpts: { pretty: true, indent: '    ', newline: '\n' },
});
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
    projectPath = slash_1.default(await core_1.SfdxProject.resolveProjectPath());
    return projectPath;
}
async function shrinkPermissionSets(permissionsets) {
    for (const file of permissionsets) {
        if (await fs.pathExists(file)) {
            const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));
            if (data.PermissionSet.fieldPermissions) {
                exports.debug({
                    permissionset: file,
                    removedFieldPermsissions: JSON.stringify(data.PermissionSet.fieldPermissions.filter((el) => el.editable.toString() === 'false' && el.readable.toString() === 'false')),
                });
                data.PermissionSet.fieldPermissions = data.PermissionSet.fieldPermissions.filter((el) => el.editable.toString() === 'true' || el.readable.toString() === 'true');
                fs.writeFileSync(file, builder.buildObject(data) + '\n');
            }
        }
    }
}
exports.shrinkPermissionSets = shrinkPermissionSets;
async function profileElementInjection(profiles, ensureObjectPermissionsFromAdmin = { ensureObjectPermissions: null }, customObjectsFilter = []) {
    const ensureUserPermissions = config_1.default(await getProjectPath()).ensureUserPermissions;
    const ensureObjectPermissions = ensureObjectPermissionsFromAdmin.ensureObjectPermissions ||
        config_1.default(await getProjectPath()).ensureObjectPermissions.filter((el) => customObjectsFilter.includes(el));
    for (const file of profiles) {
        if (await fs.pathExists(file)) {
            const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));
            if (arrayEquals(data.Profile.custom, ['true'])) {
                if (!data.Profile.objectPermissions) {
                    data.Profile['objectPermissions'] = [];
                }
                const injectedObjectPermission = [];
                ensureObjectPermissions.forEach((object) => {
                    if (data.Profile.objectPermissions &&
                        !data.Profile.objectPermissions.some((e) => compareobj(e.object, object))) {
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
                data.Profile.objectPermissions = data.Profile.objectPermissions.concat(injectedObjectPermission);
                if (!data.Profile.userPermissions) {
                    data.Profile['userPermissions'] = [];
                }
                const injectedUserPermission = [];
                ensureUserPermissions.forEach((name) => {
                    if (data.Profile.userPermissions && !data.Profile.userPermissions.some((e) => compareobj(e.name, name))) {
                        injectedUserPermission.push({ enabled: ['false'], name: [name] });
                    }
                });
                data.Profile.userPermissions = data.Profile.userPermissions.concat(injectedUserPermission);
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
                fs.writeFileSync(file, builder.buildObject(data) + '\n');
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
async function mergeDirectories(source, destination) {
    const files = await fs.readdir(source);
    let result = [];
    for (const file of files) {
        const sourceFile = path.join(source, file);
        const destinationFile = path.join(destination, file);
        if ((await fs.lstat(sourceFile)).isDirectory()) {
            result = result.concat(await mergeDirectories(sourceFile, destinationFile));
        }
        else {
            await fs.ensureDir(path.dirname(destinationFile));
            fs.writeFileSync(destinationFile, await fs.readFile(sourceFile));
            result.push({ from: sourceFile, to: destinationFile });
        }
    }
    return result;
}
async function moveSourceFilesByFolder() {
    let f = [];
    const project = await getProjectPath();
    const moveSourceFolders = config_1.default(project).moveSourceFolders;
    for (const element of moveSourceFolders) {
        const from = path.join(project, element[0]);
        const to = path.join(project, element[1]);
        if (await fs.pathExists(from)) {
            f = f.concat(await mergeDirectories(from, to));
            await fs.remove(from);
        }
    }
    return f;
}
exports.moveSourceFilesByFolder = moveSourceFilesByFolder;
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
async function logMoves(movedSourceFiles) {
    if (isOutputEnabled) {
        if (movedSourceFiles.length > 0) {
            cli_ux_1.default.styledHeader(chalk_1.default.blue('Moved Source Files'));
            const root = await getProjectPath();
            cli_ux_1.default.table(movedSourceFiles, {
                from: {
                    header: 'FROM',
                    get: (row) => path.relative(root, row.from),
                },
                to: {
                    header: 'TO',
                    get: (row) => path.relative(root, row.to),
                },
            });
        }
    }
}
exports.logMoves = logMoves;
async function applySourceFixes(filter) {
    return await applyFixes(config_1.default(await getProjectPath()).sourceFix, null, filter);
}
exports.applySourceFixes = applySourceFixes;
async function applyFixes(tags, root, filter = []) {
    if (!root) {
        root = await getProjectPath();
    }
    const updatedfiles = {};
    for (const tag of tags) {
        if (config_1.default(await getProjectPath())[tag]) {
            const c = config_1.default(await getProjectPath())[tag];
            for (const workarounds of Object.keys(c)) {
                for (const workaround of Object.keys(c[workarounds])) {
                    if (c[workarounds][workaround].isactive === true) {
                        if (c[workarounds][workaround].files) {
                            if (c[workarounds][workaround].files.delete) {
                                if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                                    updatedfiles[workarounds + '/' + workaround] = [];
                                }
                                updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(await sourcedelete(c[workarounds][workaround].files.delete, root, filter));
                            }
                            if (c[workarounds][workaround].files.modify) {
                                if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                                    updatedfiles[workarounds + '/' + workaround] = [];
                                }
                                updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(await sourcefix(c[workarounds][workaround].files.modify, root, filter));
                            }
                        }
                    }
                }
            }
        }
    }
    return updatedfiles;
}
exports.applyFixes = applyFixes;
async function sourcedelete(deletesources, root, filter) {
    const array = [];
    deletesources = deletesources.map((el) => path.join(root, el));
    if (filter.length > 0) {
        deletesources = deletesources.filter((el) => filter.includes(el));
    }
    for (const filepath of deletesources) {
        exports.debug(`delete file: ${filepath}`);
        if (await fs.pathExists(filepath)) {
            await fs.remove(filepath);
            array.push({ filePath: filepath, operation: 'deleteFile', message: '' });
        }
        else {
            exports.debug(`${filepath} not found`);
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
        const aggregator = await core_2.ConfigAggregator.create();
        aliasOrUsername = aggregator.getPropertyValue('defaultusername').toString();
    }
    const org = await core_2.Org.create({ aliasOrUsername });
    argvConnection = { instanceUrl: org.getConnection().instanceUrl, username: org.getConnection().getUsername() };
    return argvConnection;
}
// eslint-disable-next-line complexity
async function sourcefix(fixsources, root, filter) {
    const array = [];
    for (const filename of Object.keys(fixsources)) {
        const fileOrGlobPath = path.posix.join(root, filename);
        let files = await globby_1.default(fileOrGlobPath);
        if (filter.length > 0) {
            files = files.filter((el) => filter.includes(el));
        }
        for (const file of files) {
            if (await fs.pathExists(file)) {
                const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));
                exports.debug(`modify file: ${file}`);
                if (fixsources[filename].delete) {
                    for (const deltask of fixsources[filename].delete) {
                        const deltaskpaths = new object_path_1.ObjectPathResolver(data).resolveString(deltask).value();
                        for (const deltaskpath of deltaskpaths.reverse()) {
                            if (typeof deltaskpath !== 'undefined') {
                                exports.debug(`delete: ${deltaskpath}`);
                                object_path_1.objectPath.del(data, deltaskpath);
                                fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                );
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
                        if (!object_path_1.objectPath
                            .get(data, inserttask.path)
                            .some((object) => JSON.stringify(object) === JSON.stringify(inserttask.object))) {
                            exports.debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttask.path}`);
                            object_path_1.objectPath.insert(data, inserttask.path, inserttask.object, inserttask.at);
                            fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, '    ')
                            );
                            array.push({
                                filePath: file,
                                operation: 'insert',
                                message: `${JSON.stringify(inserttask.object)} at ${inserttask.path}`,
                            });
                        }
                        else {
                            exports.debug(`insert: Object ${JSON.stringify(inserttask.object)} found at ${inserttask.path}`);
                        }
                    }
                }
                if (fixsources[filename].set) {
                    for (const settask of fixsources[filename].set) {
                        const settaskpaths = new object_path_1.ObjectPathResolver(data).resolveString(settask.path).value();
                        for (const settaskpath of settaskpaths) {
                            if (typeof settaskpath !== 'undefined') {
                                if (settask.value) {
                                    if (JSON.stringify(settask.value).includes('<mydomain>')) {
                                        settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<mydomain>/i, (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[0]));
                                    }
                                    if (JSON.stringify(settask.value).includes('<instance>')) {
                                        settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<mydomain>/i, (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[1]));
                                    }
                                    if (!compareobj(object_path_1.objectPath.get(data, settaskpath), settask.value)) {
                                        exports.debug(`Set: ${JSON.stringify(settask.value)} at ${settaskpath}`);
                                        object_path_1.objectPath.set(data, settaskpath, settask.value);
                                        fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                        );
                                        array.push({
                                            filePath: file,
                                            operation: 'set',
                                            message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                                        });
                                    }
                                }
                                else if (typeof settask.object === 'object') {
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
                                    exports.debug(`set: ${JSON.stringify(settask.object)} at ${settaskpath}`);
                                    if (settask.object) {
                                        for (const k of Object.keys(settask.object)) {
                                            exports.debug(settaskpath + '.' + k);
                                            if (object_path_1.objectPath.has(data, settaskpath + '.' + k)) {
                                                exports.debug(settask.object[k]);
                                                object_path_1.objectPath.set(data, settaskpath + '.' + k, settask.object[k]);
                                                exports.debug(object_path_1.objectPath.get(data, settaskpath));
                                            }
                                        }
                                    }
                                    else {
                                        object_path_1.objectPath.insert(data, settaskpath, settask.object);
                                    }
                                    fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                    );
                                    array.push({
                                        filePath: file,
                                        operation: 'set',
                                        message: `${settask.path} ==> ${JSON.stringify(settask.object)}`,
                                    });
                                }
                                else {
                                    exports.debug(`Set: value ${JSON.stringify(settask.value)} found at ${settaskpath}`);
                                }
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
                            fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                            );
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
async function updateProfiles(profiles, retrievePackageDir, forceSourcePull) {
    if (forceSourcePull) {
        exports.debug('force:source:pull detected');
        const packageProfilesOnly = path.join(__dirname, '..', '..', '..', 'manifest', 'package-profiles-only.xml');
        const retrieveDir = path.join(retrievePackageDir, '..');
        exports.debug({ packageProfilesOnly, retrieveDir });
        let stdout;
        try {
            stdout = (await execa('sfdx', [
                'force:mdapi:retrieve',
                '--retrievetargetdir',
                path.join(retrieveDir, 'reRetrieveProfiles'),
                '--unpackaged',
                packageProfilesOnly,
                '--json',
            ])).stdout;
        }
        catch (e) {
            exports.debug(e);
            stdout = { status: 1 };
        }
        stdout = JSON.parse(stdout);
        if (stdout.status === 0) {
            exports.debug({ zipFilePath: stdout.result.zipFilePath });
            const zip = new adm_zip_1.default(stdout.result.zipFilePath);
            zip.getEntries().forEach(function (entry) {
                if (entry.entryName.includes('unpackaged/profiles/')) {
                    zip.extractEntryTo(entry, retrieveDir, true, true);
                }
            });
        }
    }
    const adminprofile = path.join(retrievePackageDir, 'profiles/Admin.profile');
    const profileElementInjectionFromAdmin = { ensureObjectPermissions: null };
    let customObjectsFilter = [];
    if (await fs.pathExists(adminprofile)) {
        profileElementInjectionFromAdmin.ensureObjectPermissions = (await xml2js.parseStringPromise(await fs.readFile(adminprofile, 'utf8'))).Profile.objectPermissions.map((el) => el.object.toString());
    }
    else {
        const manifest = await xml2js.parseStringPromise(await fs.readFile(path.join(retrievePackageDir, 'package.xml'), 'utf8'));
        customObjectsFilter = manifest.Package.types
            .filter((el) => el.name.toString() === 'CustomObject')
            .map((el) => el.members)
            .flat();
    }
    exports.debug({ profiles, profileElementInjectionFromAdmin, customObjectsFilter });
    await profileElementInjection(profiles, profileElementInjectionFromAdmin, customObjectsFilter);
}
exports.updateProfiles = updateProfiles;
//# sourceMappingURL=souceUtils.js.map