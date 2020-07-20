"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceRetrieveBase = void 0;
const tslib_1 = require("tslib");
const command_1 = require("@salesforce/command");
const chalk = require("chalk");
const createDebug = require("debug");
const fs = require("fs-extra");
const _glob = require("glob");
const path_1 = require("path");
const shell = require("shelljs");
const util = require("util");
const xml2js = require("xml2js");
const profileElementuserPermissionsInjectionFrom = require("../config/profileElementuserPermissionsInjection.json");
const object_path_1 = require("./lib/object-path");
const debug = createDebug('jayree:source');
const parseString = util.promisify(xml2js.parseString);
const glob = util.promisify(_glob);
const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    xmlns: true,
    renderOpts: { pretty: true, indent: '    ', newline: '\n' }
});
// tslint:disable-next-line: no-any
Array.prototype.equals = function (arr) {
    return this.length === arr.length && this.every((u, i) => u === arr[i]);
};
function compareobj(obj1, obj2) {
    // tslint:disable-next-line: no-any
    return (!Array.isArray(obj2) ? [obj2] : obj2).equals(!Array.isArray(obj1) ? [obj1] : obj1);
}
function exists(path) {
    try {
        fs.accessSync(path);
        return true;
    }
    catch (err) {
        // null
    }
    return false;
}
class SourceRetrieveBase extends command_1.SfdxCommand {
    log(msg, indent) {
        let prefix = '> ';
        if (indent) {
            prefix = new Array(indent * 2 + 1).join(' ');
            msg = msg.replace(/\n/g, `\n${prefix}`);
        }
        else {
            msg = chalk.bold(msg);
        }
        msg = `${prefix}${msg}`;
        if (this.flags.verbose) {
            this.ux.log(chalk.dim.yellow(msg));
        }
        else {
            this.logger.info(msg);
        }
    }
    getScopedValue(config) {
        let value;
        if (typeof config === 'object') {
            if (typeof config[this.flags.scope] === 'string') {
                value = config[this.flags.scope];
            }
            else {
                value = config.default;
            }
        }
        else {
            value = config;
        }
        return value;
    }
    async profileElementInjection(root) {
        const files = await glob(path_1.join(root, 'force-app/main/default/profiles/*'));
        if (files.length > 0) {
            const profileElementInjectionFrom = await parseString(fs.readFileSync(path_1.join(root, 'force-app/main/default/profiles/Admin.profile-meta.xml'), 'utf8'));
            for (const file of files) {
                if (exists(file)) {
                    debug(file);
                    const data = await parseString(fs.readFileSync(file, 'utf8'));
                    if (!data.Profile.objectPermissions) {
                        data.Profile['objectPermissions'] = [];
                    }
                    profileElementInjectionFrom.Profile.objectPermissions.forEach((element) => {
                        if (data.Profile.objectPermissions &&
                            !data.Profile.objectPermissions.some((e) => e.object.equals(element.object))) {
                            debug('inject objectPermission: ' + element.object);
                            Object.keys(element).forEach((k) => {
                                if (element[k].equals(['true'])) {
                                    element[k] = ['false'];
                                }
                            });
                            data.Profile.objectPermissions.push(element);
                        }
                    });
                    if (!data.Profile.userPermissions) {
                        data.Profile['userPermissions'] = [];
                    }
                    profileElementuserPermissionsInjectionFrom.Profile.userPermissions.forEach((element) => {
                        if (data.Profile.userPermissions &&
                            !data.Profile.userPermissions.some((e) => e.name.equals(element.name))) {
                            debug('inject userPermission: ' + element.name);
                            Object.keys(element).forEach((k) => {
                                if (element[k].equals(['true'])) {
                                    element[k] = ['false'];
                                }
                            });
                            data.Profile.userPermissions.push(element);
                        }
                    });
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
                }
            }
        }
    }
    // tslint:disable-next-line: no-any
    async applyfixes(config, tags, projectpath) {
        const updatedfiles = {};
        if (config) {
            for (const tag of tags) {
                if (config[tag]) {
                    const c = config[tag];
                    for (const workarounds of Object.keys(c)) {
                        for (const workaround of Object.keys(c[workarounds])) {
                            if (c[workarounds][workaround].isactive === true) {
                                if (c[workarounds][workaround].files) {
                                    if (c[workarounds][workaround].files.delete) {
                                        if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                                            updatedfiles[workarounds + '/' + workaround] = [];
                                        }
                                        updatedfiles[workarounds + '/' + workaround].push(...(await this.sourcedelete(c[workarounds][workaround].files.delete, projectpath)));
                                    }
                                    if (c[workarounds][workaround].files.modify) {
                                        if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                                            updatedfiles[workarounds + '/' + workaround] = [];
                                        }
                                        updatedfiles[workarounds + '/' + workaround].push(...(await this.sourcefix(c[workarounds][workaround].files.modify, projectpath, this.org.getConnection())));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return updatedfiles;
    }
    async sourcefix(fixsources, root, conn) {
        var e_1, _a;
        const array = [];
        try {
            for (var _b = tslib_1.__asyncValues(Object.keys(fixsources)), _c; _c = await _b.next(), !_c.done;) {
                const filename = _c.value;
                const path = path_1.join(root, filename);
                const files = await glob(path);
                for (const file of files) {
                    if (exists(file)) {
                        const data = await parseString(fs.readFileSync(file, 'utf8'));
                        debug(`modify file: ${file}`, 1);
                        if (fixsources[filename].delete) {
                            for (const deltask of fixsources[filename].delete) {
                                const delpath = () => {
                                    if (object_path_1.objectPath.get(data, deltask.path)) {
                                        let delitems = [];
                                        if (Array.isArray(object_path_1.objectPath.get(data, deltask.path))) {
                                            delitems = object_path_1.objectPath.get(data, deltask.path);
                                        }
                                        else {
                                            delitems = [object_path_1.objectPath.get(data, deltask.path)];
                                        }
                                        if (delitems.length === 1) {
                                            if ((deltask.condition &&
                                                compareobj(object_path_1.objectPath.get(data, `${deltask.path}`), deltask.condition[1])) ||
                                                typeof deltask.condition === 'undefined') {
                                                return `${deltask.path}`;
                                            }
                                        }
                                        for (let i = 0; i < delitems.length; i++) {
                                            if (deltask.object) {
                                                if (JSON.stringify(object_path_1.objectPath.get(data, `${deltask.path}.${i}`)) === JSON.stringify(deltask.object)) {
                                                    return `${deltask.path}.${i}`;
                                                }
                                            }
                                            if (deltask.condition && deltask.condition[0] === 'is') {
                                                if (compareobj(object_path_1.objectPath.get(data, `${deltask.path}.${i}`), deltask.condition[1])) {
                                                    return `${deltask.path}.${i}`;
                                                }
                                            }
                                            if (deltask.condition &&
                                                compareobj(object_path_1.objectPath.get(data, `${deltask.path}.${i}.${deltask.condition[0]}`), deltask.condition[1])) {
                                                return `${deltask.path}.${i}`;
                                            }
                                        }
                                    }
                                    else {
                                        return undefined;
                                    }
                                };
                                let _deltaskpath;
                                try {
                                    _deltaskpath = new object_path_1.ObjectPathResolver(data).resolveString(deltask).value();
                                }
                                catch (error) {
                                    _deltaskpath = [delpath()];
                                }
                                _deltaskpath.reverse().forEach((deltaskpath) => {
                                    if (typeof deltaskpath !== 'undefined') {
                                        debug(`delete: ${deltaskpath}`, 2);
                                        object_path_1.objectPath.del(data, deltaskpath);
                                        fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                        );
                                        array.push({
                                            filePath: path_1.relative(root, file),
                                            operation: 'delete',
                                            message: `${deltaskpath}${typeof deltask.condition !== 'undefined' ? ` (${deltask.condition})` : ''}`
                                        });
                                    }
                                    else {
                                        if (typeof deltask.condition !== 'undefined') {
                                            debug(`delete: condition for '${deltask.path}': '${deltask.condition
                                                .toString()
                                                .replace(',', ' => ')}' not match`, 2);
                                        }
                                        else {
                                            debug(`delete: '${deltask.path} not found`, 2);
                                        }
                                    }
                                });
                            }
                        }
                        if (fixsources[filename].insert) {
                            fixsources[filename].insert.forEach((inserttask) => {
                                if (!object_path_1.objectPath
                                    .get(data, inserttask.path)
                                    .some((object) => JSON.stringify(object) === JSON.stringify(inserttask.object))) {
                                    debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttask.path}`, 2);
                                    object_path_1.objectPath.insert(data, inserttask.path, inserttask.object, inserttask.at);
                                    fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, '    ')
                                    );
                                    array.push({
                                        filePath: path_1.relative(root, file),
                                        operation: 'insert',
                                        message: `${JSON.stringify(inserttask.object)} at ${inserttask.path}${typeof inserttask.condition !== 'undefined' ? ` (${inserttask.condition})` : ''}`
                                    });
                                }
                                else {
                                    debug(`insert: Object ${JSON.stringify(inserttask.object)} found at ${inserttask.path}`, 2);
                                }
                            });
                        }
                        if (fixsources[filename].set) {
                            fixsources[filename].set.forEach((settask) => {
                                const setpath = () => {
                                    if (object_path_1.objectPath.get(data, settask.path)) {
                                        if (settask.condition) {
                                            let delitems = [];
                                            if (Array.isArray(object_path_1.objectPath.get(data, settask.path))) {
                                                delitems = object_path_1.objectPath.get(data, settask.path);
                                            }
                                            else {
                                                delitems = [object_path_1.objectPath.get(data, settask.path)];
                                            }
                                            if (delitems.length === 1) {
                                                if (compareobj(object_path_1.objectPath.get(data, `${settask.path}`), settask.condition[1])) {
                                                    return `${settask.path}`;
                                                }
                                            }
                                            for (let i = 0; i < delitems.length; i++) {
                                                if (settask.condition[0] === 'is') {
                                                    if (compareobj(object_path_1.objectPath.get(data, `${settask.path}.${i}`), settask.condition[1])) {
                                                        return `${settask.path}.${i}`;
                                                    }
                                                }
                                                if (compareobj(object_path_1.objectPath.get(data, `${settask.path}.${i}.${settask.condition[0]}`), settask.condition[1])) {
                                                    if (settask.object) {
                                                        return `${settask.path}.${i}`;
                                                    }
                                                    return `${settask.path}.${i}.${settask.condition[0]}`;
                                                }
                                            }
                                        }
                                        else {
                                            return `${settask.path}`;
                                        }
                                    }
                                    else {
                                        return undefined;
                                    }
                                };
                                let _settaskpath;
                                try {
                                    _settaskpath = new object_path_1.ObjectPathResolver(data).resolveString(settask.path).value();
                                }
                                catch (error) {
                                    _settaskpath = [setpath()];
                                }
                                _settaskpath.forEach((settaskpath) => {
                                    if (typeof settaskpath !== 'undefined') {
                                        debug(settaskpath);
                                        if (settask.value) {
                                            if (JSON.stringify(settask.value).includes('<mydomain>')) {
                                                settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<mydomain>/i, conn.instanceUrl.substring(8).split('.')[0]));
                                            }
                                            if (JSON.stringify(settask.value).includes('<instance>')) {
                                                settask.value = JSON.parse(JSON.stringify(settask.value).replace(/<mydomain>/i, conn.instanceUrl.substring(8).split('.')[1]));
                                            }
                                            if (!compareobj(object_path_1.objectPath.get(data, settaskpath), settask.value)) {
                                                debug(`Set: ${JSON.stringify(settask.value)} at ${settaskpath}`, 2);
                                                object_path_1.objectPath.set(data, settaskpath, settask.value);
                                                fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                                );
                                                array.push({
                                                    filePath: path_1.relative(root, file),
                                                    operation: 'set',
                                                    message: `${JSON.stringify(settask.value)} at ${settaskpath}${typeof settask.condition !== 'undefined' ? ` (${settask.condition})` : ''}`
                                                });
                                            }
                                        }
                                        else if (typeof settask.object === 'object') {
                                            const validate = (node) => {
                                                const replaceArray = [];
                                                const recursive = (n, attpath) => {
                                                    // tslint:disable-next-line: forin
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
                                                replaceArray.forEach((element) => {
                                                    if (element[0] === '<username>') {
                                                        object_path_1.objectPath.set(node, element[1], conn.getUsername());
                                                    }
                                                });
                                                return node;
                                            };
                                            settask.object = validate(settask.object);
                                            debug(settaskpath);
                                            debug(settask.object);
                                            debug(`set: ${JSON.stringify(settask.object)} at ${settaskpath}`, 2);
                                            if (settask.object) {
                                                Object.keys(settask.object).forEach((k) => {
                                                    debug(settaskpath + '.' + k);
                                                    if (object_path_1.objectPath.has(data, settaskpath + '.' + k)) {
                                                        debug(settask.object[k]);
                                                        object_path_1.objectPath.set(data, settaskpath + '.' + k, settask.object[k]);
                                                        debug(object_path_1.objectPath.get(data, settaskpath));
                                                    }
                                                });
                                            }
                                            else {
                                                object_path_1.objectPath.insert(data, settaskpath, settask.object);
                                            }
                                            fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                            );
                                            array.push({
                                                filePath: path_1.relative(root, file),
                                                operation: 'set',
                                                message: `${JSON.stringify(settask.object)} at ${settaskpath}${typeof settask.condition !== 'undefined' ? ` (${settask.condition})` : ''}`
                                            });
                                        }
                                        else {
                                            debug(`Set: value ${JSON.stringify(settask.value)} found at ${settaskpath}`, 2);
                                        }
                                    }
                                });
                            });
                        }
                        if (fixsources[filename].fixflowtranslation) {
                            const flowDefinitions = object_path_1.objectPath.get(data, 'Translations.flowDefinitions');
                            flowDefinitions.forEach((flowDefinition) => {
                                const fullname = object_path_1.objectPath.get(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`);
                                if (fullname.lastIndexOf('-') > 0) {
                                    debug(`fixflowtranslation: ${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))}`, 2);
                                    object_path_1.objectPath.set(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`, fullname.substring(0, fullname.lastIndexOf('-')));
                                    fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                    );
                                    array.push({
                                        filePath: path_1.relative(root, file),
                                        operation: 'fix',
                                        message: `(${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))})`
                                    });
                                }
                                else {
                                    debug(`fixflowtranslation: ${fullname} already fixed`, 2);
                                }
                            });
                        }
                    }
                    else {
                        debug(`modify file: ${file} not found`, 1);
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return array;
    }
    async sourcedelete(deletesources, root) {
        const array = [];
        for (const filename of deletesources) {
            const path = path_1.join(root, filename);
            debug(`delete file: ${path}`, 1);
            if (exists(path)) {
                try {
                    shell.rm('-rf', path);
                    array.push({ filePath: path_1.relative(root, path), operation: 'delete', message: '' });
                }
                catch (err) {
                    this.ux.error(err);
                }
            }
            else {
                debug(`${path} not found`, 2);
            }
        }
        return array;
    }
    async cleanuppackagexml(manifest, manifestignore, root) {
        debug(`apply '${path_1.join(root, manifestignore)}' to '${manifest}'`);
        const packageignore = await parseString(fs.readFileSync(path_1.join(root, manifestignore), 'utf8'));
        const newpackage = await parseString(fs.readFileSync(manifest, 'utf8'));
        const newPackageTypesMapped = [];
        newpackage.Package.types.forEach((value) => {
            newPackageTypesMapped[value.name] = value.members;
        });
        packageignore.Package.types.forEach((types) => {
            if (typeof newPackageTypesMapped[types.name] !== 'undefined') {
                if (types.members.includes('*') && types.members.length > 1) {
                    const includedmembers = types.members.slice();
                    includedmembers.splice(includedmembers.indexOf('*'), 1);
                    debug('include only members ' + includedmembers.toString() + ' for type ' + types.name, 1);
                    newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter((value) => {
                        return types.members.includes(value);
                    });
                }
                if (types.members.includes('*') && types.members.length === 1) {
                    debug('exclude all members for type ' + types.name, 1);
                    newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter(() => {
                        return false;
                    });
                }
                if (!types.members.includes('*')) {
                    newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter((value) => {
                        return !types.members.includes(value);
                    });
                }
            }
        });
        const newPackageTypesUpdated = [];
        Object.keys(newPackageTypesMapped).forEach((key) => {
            if (newPackageTypesMapped[key].length > 0) {
                newPackageTypesUpdated.push({
                    name: key,
                    members: newPackageTypesMapped[key]
                });
            }
        });
        newpackage.Package.types = newPackageTypesUpdated;
        fs.writeFileSync(manifest, builder.buildObject(newpackage));
    }
}
exports.SourceRetrieveBase = SourceRetrieveBase;
//# sourceMappingURL=sourceRetrieveBase.js.map