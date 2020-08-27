/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { builder, parseStringSync } from './xml';

// eslint-disable-next-line @typescript-eslint/require-await
export async function cleanupManifestTypes(packageTypesMapped, ignoreManifest) {
  const packageignore = parseStringSync(fs.readFileSync(ignoreManifest, 'utf8'));

  packageignore.Package.types.forEach((types) => {
    if (typeof packageTypesMapped[types.name] !== 'undefined') {
      if (types.members.includes('*') && types.members.length > 1) {
        const includedmembers = types.members.slice();
        includedmembers.splice(includedmembers.indexOf('*'), 1);
        cli.log('include only members ' + includedmembers.toString() + ' for type ' + types.name);
        packageTypesMapped[types.name] = packageTypesMapped[types.name].filter((value) => {
          return types.members.includes(value);
        });
      }

      if (types.members.includes('*') && types.members.length === 1) {
        cli.log('exclude all members for type ' + types.name);
        packageTypesMapped[types.name] = packageTypesMapped[types.name].filter(() => {
          return false;
        });
      }

      if (!types.members.includes('*')) {
        packageTypesMapped[types.name] = packageTypesMapped[types.name].filter((value) => {
          return !types.members.includes(value);
        });
      }
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
  const newpackage = parseStringSync(fs.readFileSync(manifest, 'utf8'));

  cli.log(`apply '${ignoreManifest}' to '${manifest}'`);

  const newPackageTypesMapped = [];
  newpackage.Package.types.forEach((value) => {
    newPackageTypesMapped[value.name] = value.members;
  });

  const newPackageTypesUpdated = await cleanupManifestTypes(newPackageTypesMapped, ignoreManifest);

  newpackage.Package.types = newPackageTypesUpdated;

  fs.writeFileSync(manifest, builder.buildObject(newpackage));
}
