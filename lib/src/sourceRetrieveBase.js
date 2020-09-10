"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceRetrieveBase = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path_1 = require("path");
const util = tslib_1.__importStar(require("util"));
const command_1 = require("@salesforce/command");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs = tslib_1.__importStar(require("fs-extra"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const xml2js = tslib_1.__importStar(require("xml2js"));
const souceUtils = tslib_1.__importStar(require("./utils/souceUtils"));
const debug = debug_1.default('jayree:source');
const parseString = util.promisify(xml2js.parseString);
const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    xmlns: true,
    renderOpts: { pretty: true, indent: '    ', newline: '\n' },
});
class SourceRetrieveBase extends command_1.SfdxCommand {
    log(msg, indent) {
        let prefix = '> ';
        if (indent) {
            prefix = new Array(indent * 2 + 1).join(' ');
            msg = msg.replace(/\n/g, `\n${prefix}`);
        }
        else {
            msg = chalk_1.default.bold(msg);
        }
        msg = `${prefix}${msg}`;
        if (this.flags.verbose) {
            this.ux.log(chalk_1.default.dim.yellow(msg));
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
        const profiles = await globby_1.default(path_1.join(root, 'force-app/main/default/profiles/*'));
        const adminProfilePath = path_1.join(root, 'force-app/main/default/profiles/Admin.profile-meta.xml');
        if (profiles.length > 0) {
            if (await fs.pathExists(adminProfilePath)) {
                const profileElementInjectionFromAdmin = {
                    ensureObjectPermissions: (await parseString(fs.readFileSync(adminProfilePath, 'utf8'))).Profile.objectPermissions.map((el) => el.object.toString()),
                };
                await souceUtils.profileElementInjection(profiles, profileElementInjectionFromAdmin);
            }
        }
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
                    members: newPackageTypesMapped[key],
                });
            }
        });
        newpackage.Package.types = newPackageTypesUpdated;
        fs.writeFileSync(manifest, builder.buildObject(newpackage));
    }
}
exports.SourceRetrieveBase = SourceRetrieveBase;
//# sourceMappingURL=sourceRetrieveBase.js.map