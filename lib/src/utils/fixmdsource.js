"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@salesforce/core");
const fs = require("fs");
const _glob = require("glob");
const path_1 = require("path");
const shell = require("shelljs");
const util = require("util");
const xml2js = require("xml2js");
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
async function sourcefix(fixsources, root) {
    var e_1, _a;
    const logger = await core_1.Logger.child('RetrieveProfiles');
    try {
        for (var _b = tslib_1.__asyncValues(Object.keys(fixsources)), _c; _c = await _b.next(), !_c.done;) {
            const filename = _c.value;
            const path = path_1.join(root, filename);
            const files = await glob(path);
            for (const file of files) {
                if (exists(file)) {
                    let data;
                    new xml2js.Parser().parseString(fs.readFileSync(file, 'utf8'), (e, r) => {
                        data = r;
                    });
                    logger.info(`modify file: ${file}`, 1);
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
                                        if ((deltask.condition && compareobj(objectPath.get(data, `${deltask.path}`), deltask.condition[1])) ||
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
                                // console.log(`delete: ${delpath()}`, 2);
                                objectPath.del(data, delpath());
                                fs.writeFileSync(file, builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                                );
                            }
                            else {
                                if (typeof deltask.condition !== 'undefined') {
                                    /*                   console.log(
                                        `delete: condition for '${deltask.path}': '${deltask.condition
                                          .toString()
                                          .replace(',', ' => ')}' not match`,
                                        2
                                      ); */
                                }
                                else {
                                    // console.log(`delete: '${deltask.path} not found`, 2);
                                }
                            }
                        }
                    }
                }
                else {
                    // console.log(`modify file: ${path} not found`, 1);
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
exports.sourcefix = sourcefix;
async function sourcedelete(deletesources, root) {
    const logger = await core_1.Logger.child('RetrieveProfiles');
    for (const filename of deletesources) {
        const path = path_1.join(root, filename);
        logger.info(`delete file: ${path}`, 1);
        // if (exists(path)) {
        if (exists(path)) {
            try {
                shell.rm('-rf', path);
            }
            catch (err) {
                // console.error(err);
            }
        }
        else {
            // console.log(`${path} not found`, 2);
        }
    }
}
exports.sourcedelete = sourcedelete;
//# sourceMappingURL=fixmdsource.js.map