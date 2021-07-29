/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { parseManifest, js2Manifest, normalizeToArray } from '../utils/xml';

// eslint-disable-next-line @typescript-eslint/require-await
export async function cleanupManifestTypes(packageTypesMapped, ignoreManifest) {
  const packageignore = parseManifest(fs.readFileSync(ignoreManifest, 'utf8')).Package;

  const packageTypes = normalizeToArray(packageignore.types);

  packageTypes.forEach((types) => {
    if (typeof packageTypesMapped[types.name] !== 'undefined') {
      packageTypesMapped[types.name] = normalizeToArray(packageTypesMapped[types.name]);
      const packageTypeMembers = normalizeToArray(types.members);
      if (packageTypeMembers.includes('*') && packageTypeMembers.length > 1) {
        const includedmembers = packageTypeMembers.slice();
        includedmembers.splice(includedmembers.indexOf('*'), 1);
        cli.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
        packageTypesMapped[types.name] = packageTypesMapped[types.name].filter((value) => {
          return packageTypeMembers.includes(value);
        });
      }

      if (packageTypeMembers.includes('*') && packageTypeMembers.length === 1) {
        cli.log('exclude all members for type ' + types.name);
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

export async function cleanupManifestFile(manifest, ignoreManifest) {
  const newpackage = parseManifest(fs.readFileSync(manifest, 'utf8'));

  cli.log(`apply '${ignoreManifest}' to '${manifest}'`);

  const newPackageTypesMapped = [];
  newpackage.Package.types.forEach((value) => {
    newPackageTypesMapped[value.name] = value.members;
  });

  const newPackageTypesUpdated = await cleanupManifestTypes(newPackageTypesMapped, ignoreManifest);

  newpackage.Package.types = newPackageTypesUpdated;

  fs.writeFileSync(manifest, js2Manifest(newpackage));
}
