"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupManifestFile = exports.cleanupManifestTypes = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const cli_ux_1 = require("cli-ux");
const fs = (0, tslib_1.__importStar)(require("fs-extra"));
const xml_1 = require("../utils/xml");
// eslint-disable-next-line @typescript-eslint/require-await
async function cleanupManifestTypes(packageTypesMapped, ignoreManifest) {
    const packageignore = (0, xml_1.parseManifest)(fs.readFileSync(ignoreManifest, 'utf8')).Package;
    const packageTypes = (0, xml_1.normalizeToArray)(packageignore.types);
    packageTypes.forEach((types) => {
        if (typeof packageTypesMapped[types.name] !== 'undefined') {
            packageTypesMapped[types.name] = (0, xml_1.normalizeToArray)(packageTypesMapped[types.name]);
            const packageTypeMembers = (0, xml_1.normalizeToArray)(types.members);
            if (packageTypeMembers.includes('*') && packageTypeMembers.length > 1) {
                const includedmembers = packageTypeMembers.slice();
                includedmembers.splice(includedmembers.indexOf('*'), 1);
                cli_ux_1.cli.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
                packageTypesMapped[types.name] = packageTypesMapped[types.name].filter((value) => {
                    return packageTypeMembers.includes(value);
                });
            }
            if (packageTypeMembers.includes('*') && packageTypeMembers.length === 1) {
                cli_ux_1.cli.log('exclude all members for type ' + types.name);
                packageTypesMapped[types.name] = packageTypesMapped[types.name].filter(() => {
                    return false;
                });
            }
            if (!packageTypeMembers.includes('*')) {
                packageTypesMapped[types.name] = packageTypesMapped[types.name].filter((value) => {
                    return !packageTypeMembers.includes(value);
                });
            }
            packageTypeMembers.forEach((member) => {
                if (member.startsWith('!')) {
                    packageTypesMapped[types.name].push(member.substring(1));
                }
            });
        }
    });
    const newPackageTypesUpdated = [];
    Object.keys(packageTypesMapped).forEach((key) => {
        if (packageTypesMapped[key].length > 0) {
            newPackageTypesUpdated.push({
                name: key,
                members: packageTypesMapped[key],
            });
        }
    });
    return newPackageTypesUpdated;
}
exports.cleanupManifestTypes = cleanupManifestTypes;
async function cleanupManifestFile(manifest, ignoreManifest) {
    const newpackage = (0, xml_1.parseManifest)(fs.readFileSync(manifest, 'utf8'));
    cli_ux_1.cli.log(`apply '${ignoreManifest}' to '${manifest}'`);
    const newPackageTypesMapped = [];
    newpackage.Package.types.forEach((value) => {
        newPackageTypesMapped[value.name] = value.members;
    });
    const newPackageTypesUpdated = await cleanupManifestTypes(newPackageTypesMapped, ignoreManifest);
    newpackage.Package.types = newPackageTypesUpdated;
    fs.writeFileSync(manifest, (0, xml_1.js2Manifest)(newpackage));
}
exports.cleanupManifestFile = cleanupManifestFile;
//# sourceMappingURL=manifest.js.map