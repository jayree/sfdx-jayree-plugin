/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { SfProject } from '@salesforce/core';
import { traverse } from '@salesforce/core/lib/util/internal.js';
import kit from '@salesforce/kit';
import { ux } from '@oclif/core';
import globby from 'globby';
import { Org, ConfigAggregator } from '@salesforce/core';
import chalk from 'chalk';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import Debug from 'debug';
import { parseSourceComponent, js2SourceComponent } from '../utils/xml.js';
import config from './config.js';
import { objectPath, ObjectPathResolver } from './object-path.js';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON');
function arrayEquals(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((u, i) => u === arr2[i]);
}
function compareobj(obj1, obj2) {
    return arrayEquals(kit.ensureArray(obj1), kit.ensureArray(obj2));
}
const debug = Debug('jayree:source');
let argvConnection = { username: null, instanceUrl: null };
let projectPath = '';
export async function getProjectPath() {
    if (projectPath.length > 0) {
        return projectPath;
    }
    try {
        projectPath = (await SfProject.resolveProjectPath()).split(path.sep).join(path.posix.sep);
        return projectPath;
    }
    catch (error) {
        return undefined;
    }
}
export async function profileElementInjection(profiles, customObjectsFilter = []) {
    const ensureUserPermissions = config(await getProjectPath()).ensureUserPermissions;
    let ensureObjectPermissions = config(await getProjectPath()).ensureObjectPermissions;
    if (customObjectsFilter.length) {
        ensureObjectPermissions = ensureObjectPermissions.filter((el) => customObjectsFilter.includes(el));
    }
    if (ensureObjectPermissions.length === 0) {
        process.once('exit', () => {
            ux.warn('no ensureObjectPermissions list configured');
        });
    }
    for await (const file of profiles) {
        if (await fs.pathExists(file)) {
            const data = parseSourceComponent(await fs.readFile(file, 'utf8'));
            if (data.Profile.custom === 'true') {
                const objectPermissions = kit.ensureArray(data.Profile['objectPermissions']);
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
                const userPermissions = kit.ensureArray(data.Profile['userPermissions']);
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
                fs.writeFileSync(file, js2SourceComponent(data));
                debug({
                    profile: file,
                    injectedObjectPermission: JSON.stringify(injectedObjectPermission),
                    injectedUserPermission: JSON.stringify(injectedUserPermission),
                });
            }
        }
    }
}
export async function logFixes(updatedfiles) {
    if (isOutputEnabled) {
        const root = await getProjectPath();
        Object.keys(updatedfiles).forEach((workaround) => {
            if (updatedfiles[workaround].length > 0) {
                ux.styledHeader(chalk.blue(`Fixed Source: ${workaround}`));
                ux.table(updatedfiles[workaround], {
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
async function getGlobbyBaseDirectory(globbypath) {
    try {
        (await fs.lstat(globbypath)).isDirectory();
        return globbypath;
    }
    catch (error) {
        return getGlobbyBaseDirectory(path.dirname(globbypath));
    }
}
async function sourcemove(movesources, root, filter) {
    const array = [];
    for await (const filepath of movesources) {
        let files = await globby(path.posix.join(root.split(path.sep).join(path.posix.sep), filepath[0]));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        const from = await getGlobbyBaseDirectory(filepath[0]);
        for await (const file of files) {
            if (await fs.pathExists(file)) {
                const destinationFile = path.join(filepath[1], path.relative(from, file));
                debug(`move file: ${file} to ${destinationFile}`);
                await fs.ensureDir(path.dirname(destinationFile));
                await fs.rename(file, destinationFile);
                array.push({ filePath: file, operation: 'moveFile', message: destinationFile });
            }
            else {
                debug(`${filepath} not found`);
            }
        }
    }
    return array;
}
async function sourcedelete(deletesources, root, filter) {
    const array = [];
    for await (const filepath of deletesources) {
        let files = await globby(path.posix.join(root.split(path.sep).join(path.posix.sep), filepath));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        for await (const file of files) {
            if (await fs.pathExists(file)) {
                debug(`delete file: ${file}`);
                await fs.remove(file);
                array.push({ filePath: file, operation: 'deleteFile', message: '' });
            }
            else {
                debug(`${file} not found`);
            }
        }
    }
    return array;
}
export async function getConnectionFromArgv() {
    if (Object.values(argvConnection).some((x) => x !== null && x !== '')) {
        return new Promise((resolve) => {
            resolve(argvConnection);
        });
    }
    const argv = [...process.argv];
    let aliasOrUsername = '';
    while (argv.length && aliasOrUsername.length === 0) {
        const input = argv.shift();
        if (input.startsWith('-u') ||
            input.startsWith('--targetusername') ||
            input.startsWith('-o') ||
            input.startsWith('--target-org')) {
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
            const aggregator = await ConfigAggregator.create();
            aliasOrUsername = aggregator.getPropertyValue('target-org').toString();
        }
        catch {
            throw new Error('This command requires a username to apply <mydomain> or <username>. Specify it with the -u (-o) parameter or with the "sfdx config:set defaultusername=<username>" command.');
        }
    }
    const org = await Org.create({ aliasOrUsername });
    argvConnection = { instanceUrl: org.getConnection().instanceUrl, username: org.getConnection().getUsername() };
    return argvConnection;
}
// eslint-disable-next-line complexity
async function sourcefix(fixsources, root, filter) {
    const array = [];
    for await (const filename of Object.keys(fixsources)) {
        let files = await globby(path.posix.join(root.split(path.sep).join(path.posix.sep), filename));
        if (filter.length > 0) {
            files = files.filter((el) => filter.map((f) => f.split(path.sep).join(path.posix.sep)).includes(el));
        }
        for await (const file of files) {
            if (await fs.pathExists(file)) {
                const data = parseSourceComponent(await fs.readFile(file, 'utf8'));
                debug(`modify file: ${file}`);
                if (fixsources[filename].delete) {
                    for (const deltask of fixsources[filename].delete) {
                        const deltaskpaths = new ObjectPathResolver(data).resolveString(deltask).value();
                        for (const deltaskpath of deltaskpaths.reverse()) {
                            if (typeof deltaskpath !== 'undefined') {
                                debug(`delete: ${deltaskpath}`);
                                objectPath.del(data, deltaskpath);
                                fs.writeFileSync(file, js2SourceComponent(data));
                                array.push({
                                    filePath: file,
                                    operation: 'delete',
                                    message: deltask,
                                });
                            }
                            else {
                                debug(`delete: '${deltask.path} not found`);
                            }
                        }
                    }
                }
                if (fixsources[filename].insert) {
                    for (const inserttask of fixsources[filename].insert) {
                        if (inserttask.object) {
                            const inserttaskpaths = new ObjectPathResolver(data).resolveString(inserttask.path).value();
                            if (inserttaskpaths.length > 0) {
                                let match = '';
                                for (const inserttaskpath of inserttaskpaths) {
                                    if (typeof inserttaskpath !== 'undefined') {
                                        if (JSON.stringify(objectPath.get(data, inserttaskpath)).includes(JSON.stringify(inserttask.object).replace('{', '').replace('}', ''))) {
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
                                        debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttaskpath}`);
                                        objectPath.insert(data, inserttaskpath, inserttask.object, inserttask.at);
                                    }
                                    else {
                                        inserttaskpath = lastItem;
                                        debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttaskpath}`);
                                        Object.keys(inserttask.object).forEach((key) => {
                                            objectPath.set(data, `${inserttaskpath}.${key}`, inserttask.object[key]);
                                        });
                                    }
                                    fs.writeFileSync(file, js2SourceComponent(data));
                                    array.push({
                                        filePath: file,
                                        operation: 'insert',
                                        message: `${JSON.stringify(inserttask.object)} at ${inserttaskpath}`,
                                    });
                                }
                                else {
                                    debug(`insert: Object ${JSON.stringify(inserttask.object)} found at ${match}`);
                                }
                            }
                        }
                    }
                }
                if (fixsources[filename].set) {
                    for await (const settask of fixsources[filename].set) {
                        const settaskpaths = new ObjectPathResolver(data).resolveString(settask.path).value();
                        if (settaskpaths.length > 0) {
                            for await (const settaskpath of settaskpaths) {
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
                                    if (settask.value && !compareobj(objectPath.get(data, settaskpath), settask.value)) {
                                        debug(`Set: ${JSON.stringify(settask.value)} at ${settaskpath}`);
                                        objectPath.set(data, settaskpath, `${settask.value}`);
                                        fs.writeFileSync(file, js2SourceComponent(data));
                                        array.push({
                                            filePath: file,
                                            operation: 'set',
                                            message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                                        });
                                    }
                                    else {
                                        debug(`Set: value ${JSON.stringify(settask.value)} found at ${settaskpath}`);
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
                                                    else if (n[attributename] === '<username>') {
                                                        replaceArray.push([n[attributename], attpath]);
                                                    }
                                                }
                                            };
                                            recursive(node, '');
                                            for await (const element of replaceArray) {
                                                if (element[0] === '<username>') {
                                                    objectPath.set(node, element[1], (await getConnectionFromArgv()).username);
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
                                    if (settask.object && !checkequal(settask.object, objectPath.get(data, settaskpath))) {
                                        debug(`set: ${JSON.stringify(settask.object)} at ${settaskpath}`);
                                        if (settask.object) {
                                            let modifiedPath = '';
                                            for (const k of Object.keys(settask.object)) {
                                                debug(settaskpath + '.' + k);
                                                if (objectPath.has(data, settaskpath + '.' + k)) {
                                                    debug(settask.object[k]);
                                                    if (!compareobj(objectPath.get(data, settaskpath + '.' + k), settask.object[k])) {
                                                        modifiedPath = settaskpath;
                                                        objectPath.set(data, settaskpath + '.' + k, settask.object[k]);
                                                        debug({ modifiedPath });
                                                    }
                                                    debug(objectPath.get(data, settaskpath));
                                                }
                                            }
                                            if (modifiedPath) {
                                                fs.writeFileSync(file, js2SourceComponent(data));
                                                array.push({
                                                    filePath: file,
                                                    operation: 'set',
                                                    message: `${modifiedPath} ==> ${JSON.stringify(settask.object)}`,
                                                });
                                            }
                                        }
                                    }
                                    else {
                                        debug(`Set: value ${JSON.stringify(settask.object)} found at ${settaskpath}`);
                                    }
                                }
                            }
                        }
                        else if (settask.value) {
                            debug(`Set: ${JSON.stringify(settask.value)} at ${settask.path}`);
                            if (objectPath.has(data, settask.path)) {
                                objectPath.set(data, settask.path, `${settask.value}`);
                                fs.writeFileSync(file, js2SourceComponent(data));
                                array.push({
                                    filePath: file,
                                    operation: 'set',
                                    message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                                });
                            }
                        }
                        else if (typeof settask.object === 'object') {
                            objectPath.set(data, settask.path + '.0', settask.object);
                            debug(objectPath.get(data, settask.path));
                            fs.writeFileSync(file, js2SourceComponent(data));
                            array.push({
                                filePath: file,
                                operation: 'set',
                                message: `${settask.path} ==> ${JSON.stringify(settask.object)}`,
                            });
                        }
                    }
                }
                if (fixsources[filename].fixflowtranslation) {
                    const flowDefinitions = objectPath.get(data, 'Translations.flowDefinitions');
                    for (const flowDefinition of flowDefinitions) {
                        const fullname = objectPath.get(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`);
                        if (fullname.lastIndexOf('-') > 0) {
                            debug(`fixflowtranslation: ${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))}`);
                            objectPath.set(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`, fullname.substring(0, fullname.lastIndexOf('-')));
                            fs.writeFileSync(file, js2SourceComponent(data));
                            array.push({
                                filePath: file,
                                operation: 'fix',
                                message: `(${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))})`,
                            });
                        }
                        else {
                            debug(`fixflowtranslation: ${fullname} already fixed`);
                        }
                    }
                }
            }
            else {
                debug(`modify file: ${file} not found`);
            }
        }
    }
    return array;
}
// eslint-disable-next-line complexity
export async function applyFixes(tags, root, filter = []) {
    if (!root) {
        root = await getProjectPath();
    }
    const configPath = await traverse.forFile(process.cwd(), '.sfdx-jayree.json');
    const updatedfiles = {};
    for await (const tag of tags) {
        const fix = config(configPath)[tag];
        if (fix) {
            let result = [];
            for await (const workarounds of Object.keys(fix)) {
                for await (const workaround of Object.keys(fix[workarounds])) {
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
    for await (const tag of tags) {
        const fix = config(configPath)[tag];
        if (fix) {
            for await (const workarounds of Object.keys(fix)) {
                for await (const workaround of Object.keys(fix[workarounds])) {
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
    for await (const tag of tags) {
        const fix = config(configPath)[tag];
        if (fix) {
            for await (const workarounds of Object.keys(fix)) {
                for await (const workaround of Object.keys(fix[workarounds])) {
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
export async function applySourceFixes(filter) {
    return applyFixes(config(await getProjectPath()).applySourceFixes, null, filter);
}
export async function updateProfiles(profiles, customObjects, forceSourcePull) {
    if (forceSourcePull) {
        debug('force:source:pull detected');
        const targetDir = process.env.SFDX_MDAPI_TEMP_DIR || os.tmpdir();
        const destRoot = path.join(targetDir, 'reRetrieveProfiles');
        debug({ destRoot });
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
        config(await getProjectPath()).ensureObjectPermissions.forEach((fullName) => {
            ComponentSetArray.push({ fullName, type: 'CustomObject' });
        });
        const componentSet = new ComponentSet(ComponentSetArray);
        const mdapiRetrieve = await componentSet.retrieve({
            usernameOrConnection: (await getConnectionFromArgv()).username,
            merge: true,
            output: destRoot,
        });
        const retrieveResult = await mdapiRetrieve.pollStatus(1000);
        customObjects = retrieveResult.getFileResponses().filter((el) => el.type === 'CustomObject');
        for await (const retrieveProfile of retrieveResult
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
    debug({ profiles, customObjectsFilter });
    await profileElementInjection(profiles.map((profile) => profile.filePath).filter(Boolean), customObjectsFilter);
}
//# sourceMappingURL=souceUtils.js.map