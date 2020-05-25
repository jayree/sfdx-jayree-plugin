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
const debug = createDebug('jayree:source');
const parseString = util.promisify(xml2js.parseString);
const glob = util.promisify(_glob);
const objectPath = require("object-path");
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
    async profileElementInjection(root) {
        const files = await glob(path_1.join(root, 'force-app/main/default/profiles/*'));
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
                    if (data.Profile.userPermissions && !data.Profile.userPermissions.some((e) => e.name.equals(element.name))) {
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
    async sourcefix(fixsources, root, conn) {
        var e_1, _a;
        try {
            for (var _b = tslib_1.__asyncValues(Object.keys(fixsources)), _c; _c = await _b.next(), !_c.done;) {
                const filename = _c.value;
                const path = path_1.join(root, filename);
                const files = await glob(path);
                for (const file of files) {
                    if (exists(file)) {
                        const data = await parseString(fs.readFileSync(file, 'utf8'));
                        this.log(`modify file: ${file}`, 1);
                        if (fixsources[filename].delete) {
                            for (const deltask of fixsources[filename].delete) {
                                const delpath = () => {
                                    if (objectPath.get(data, deltask.path)) {
                                        let delitems = [];
                                        if (Array.isArray(objectPath.get(data, deltask.path))) {
                                            delitems = objectPath.get(data, deltask.path);
                                        }
                                        else {
                                            delitems = [objectPath.get(data, deltask.path)];
                                        }
                                        if (delitems.length === 1) {
                                            if ((deltask.condition &&
                                                compareobj(objectPath.get(data, `${deltask.path}`), deltask.condition[1])) ||
                                                typeof deltask.condition === 'undefined') {
                                                return `${deltask.path}`;
                                            }
                                        }
                                        for (let i = 0; i < delitems.length; i++) {
                                            if (deltask.object) {
                                                if (JSON.stringify(objectPath.get(data, `${deltask.path}.${i}`)) === JSON.stringify(deltask.object)) {
                                                    return `${deltask.path}.${i}`;
                                                }
                                            }
                                            if (deltask.condition && deltask.condition[0] === 'is') {
                                                if (compareobj(objectPath.get(data, `${deltask.path}.${i}`), deltask.condition[1])) {
                                                    return `${deltask.path}.${i}`;
                                                }
                                            }
                                            if (deltask.condition &&
                                                compareobj(objectPath.get(data, `${deltask.path}.${i}.${deltask.condition[0]}`), deltask.condition[1])) {
                                                return `${deltask.path}.${i}`;
                                            }
                                        }
                                    }
                                    else {
                                        return undefined;
                                    }
                                };
                                if (typeof delpath() !== 'undefined') {
                                    this.log(`delete: ${delpath()}`, 2);
                                    objectPath.del(data, delpath());
                                    fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                    );
                                }
                                else {
                                    if (typeof deltask.condition !== 'undefined') {
                                        this.log(`delete: condition for '${deltask.path}': '${deltask.condition
                                            .toString()
                                            .replace(',', ' => ')}' not match`, 2);
                                    }
                                    else {
                                        this.log(`delete: '${deltask.path} not found`, 2);
                                    }
                                }
                            }
                        }
                        if (fixsources[filename].insert) {
                            fixsources[filename].insert.forEach((inserttask) => {
                                if (!objectPath
                                    .get(data, inserttask.path)
                                    .some((object) => JSON.stringify(object) === JSON.stringify(inserttask.object))) {
                                    this.log(`insert: ${JSON.stringify(inserttask.object)} at ${inserttask.path}`, 2);
                                    objectPath.insert(data, inserttask.path, inserttask.object, inserttask.at);
                                    fs.writeFileSync(file, (builder.buildObject(data) + '\n').replace(/ {2}/g, '    '));
                                }
                                else {
                                    this.log(`insert: Object ${JSON.stringify(inserttask.object)} found at ${inserttask.path}`, 2);
                                }
                            });
                        }
                        if (fixsources[filename].set) {
                            fixsources[filename].set.forEach((settask) => {
                                /*               const checkcondition = () => {
                                  if (typeof settask.condition !== 'undefined') {
                                    if (compareobj(objectPath.get(data, `${settask.path}`), settask.condition[1])) {
                                      return true;
                                    } else {
                                      return false;
                                    }
                                  } else {
                                    return true;
                                  }
                                }; */
                                const setpath = () => {
                                    if (objectPath.get(data, settask.path)) {
                                        if (settask.condition) {
                                            let delitems = [];
                                            if (Array.isArray(objectPath.get(data, settask.path))) {
                                                delitems = objectPath.get(data, settask.path);
                                            }
                                            else {
                                                delitems = [objectPath.get(data, settask.path)];
                                            }
                                            if (delitems.length === 1) {
                                                if (compareobj(objectPath.get(data, `${settask.path}`), settask.condition[1])) {
                                                    return `${settask.path}`;
                                                }
                                            }
                                            for (let i = 0; i < delitems.length; i++) {
                                                if (settask.condition[0] === 'is') {
                                                    if (compareobj(objectPath.get(data, `${settask.path}.${i}`), settask.condition[1])) {
                                                        return `${settask.path}.${i}`;
                                                    }
                                                }
                                                if (compareobj(objectPath.get(data, `${settask.path}.${i}.${settask.condition[0]}`), settask.condition[1])) {
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
                                if (typeof setpath() !== 'undefined') {
                                    settask.path = setpath();
                                    debug(settask.path);
                                    // if (checkcondition()) {
                                    if (settask.value) {
                                        if (settask.value.indexOf('<mydomain>') > -1) {
                                            settask.value = settask.value.replace(/<mydomain>/i, conn.instanceUrl.substring(8).split('.')[0]);
                                            settask.value = settask.value.replace(/<instance>/i, conn.instanceUrl.substring(8).split('.')[1]);
                                        }
                                        if (!compareobj(objectPath.get(data, settask.path), settask.value)) {
                                            this.log(`Set: ${JSON.stringify(settask.value)} at ${settask.path}`, 2);
                                            objectPath.set(data, settask.path, settask.value);
                                            fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                            );
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
                                                    objectPath.set(node, element[1], conn.getUsername());
                                                }
                                            });
                                            return node;
                                        };
                                        settask.object = validate(settask.object);
                                        debug(settask.path);
                                        debug(settask.object);
                                        this.log(`set: ${JSON.stringify(settask.object)} at ${settask.path}`, 2);
                                        if (settask.object) {
                                            Object.keys(settask.object).forEach((k) => {
                                                debug(settask.path + '.' + k);
                                                if (objectPath.has(data, settask.path + '.' + k)) {
                                                    debug(settask.object[k]);
                                                    objectPath.set(data, settask.path + '.' + k, settask.object[k]);
                                                    debug(objectPath.get(data, settask.path));
                                                }
                                            });
                                        }
                                        else {
                                            objectPath.insert(data, settask.path, settask.object);
                                        }
                                        fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                        );
                                    }
                                    else {
                                        this.log(`Set: value ${JSON.stringify(settask.value)} found at ${settask.path}`, 2);
                                    }
                                }
                                /*               } else {
                                  this.log(
                                    `Set: condition for '${settask.path}': '${settask.condition
                                      .toString()
                                      .replace(',', ' => ')}' not match (value is: '${objectPath.get(data, `${settask.path}`)}')`,
                                    2
                                  );
                                } */
                            });
                        }
                        if (fixsources[filename].fixflowtranslation) {
                            const flowDefinitions = objectPath.get(data, 'Translations.flowDefinitions');
                            flowDefinitions.forEach((flowDefinition) => {
                                const fullname = objectPath.get(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`);
                                if (fullname.lastIndexOf('-') > 0) {
                                    this.log(`fixflowtranslation: ${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))}`, 2);
                                    objectPath.set(data, `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`, fullname.substring(0, fullname.lastIndexOf('-')));
                                    fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                    );
                                }
                                else {
                                    this.log(`fixflowtranslation: ${fullname} already fixed`, 2);
                                }
                            });
                        }
                    }
                    else {
                        this.log(`modify file: ${file} not found`, 1);
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
    }
    async sourcedelete(deletesources, root) {
        for (const filename of deletesources) {
            const path = path_1.join(root, filename);
            this.log(`delete file: ${path}`, 1);
            // if (exists(path)) {
            if (exists(path)) {
                try {
                    shell.rm('-rf', path);
                }
                catch (err) {
                    this.ux.error(err);
                }
            }
            else {
                this.log(`${path} not found`, 2);
            }
        }
    }
    async cleanuppackagexml(manifest, manifestignore, root) {
        this.log(`apply '${path_1.join(root, manifestignore)}' to '${manifest}'`);
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
                    this.log('include only members ' + includedmembers.toString() + ' for type ' + types.name, 1);
                    newPackageTypesMapped[types.name] = newPackageTypesMapped[types.name].filter((value) => {
                        return types.members.includes(value);
                    });
                }
                if (types.members.includes('*') && types.members.length === 1) {
                    this.log('exclude all members for type ' + types.name, 1);
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