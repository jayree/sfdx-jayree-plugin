/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as xml2js from 'xml2js';
import { SfdxProject } from '@salesforce/core';
import cli from 'cli-ux';
import globby from 'globby';
import { Org, ConfigAggregator } from '@salesforce/core';
import chalk from 'chalk';
import AdmZip from 'adm-zip';
import execa = require('execa');
import config from './config';
import { objectPath, ObjectPathResolver } from './object-path';

// const parseStringPromise = util.promisify(xml2js.parseString);

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
export const debug = require('debug')('jayree:source');

type argvConnection = {
  username: string;
  instanceUrl: string;
};

let argvConnection: argvConnection = { username: null, instanceUrl: null };
let projectPath = '';

async function getProjectPath(): Promise<string> {
  if (projectPath.length > 0) {
    return projectPath;
  }
  projectPath = await SfdxProject.resolveProjectPath();
  return projectPath;
}

export async function shrinkPermissionSets(permissionsets) {
  debug({ permissionsets });
  for (const file of permissionsets) {
    if (await fs.pathExists(file)) {
      const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));
      if (data.PermissionSet.fieldPermissions) {
        data.PermissionSet.fieldPermissions = data.PermissionSet.fieldPermissions.filter(
          (el) => el.editable.toString() === 'true' || el.readable.toString() === 'true'
        );
        fs.writeFileSync(file, builder.buildObject(data) + '\n');
      }
    }
  }
}

export async function profileElementInjection(
  profiles,
  ensureObjectPermissionsFromAdmin = { ensureObjectPermissions: null },
  customObjectsFilter = []
) {
  const ensureUserPermissions = config(await getProjectPath()).ensureUserPermissions;
  const ensureObjectPermissions =
    ensureObjectPermissionsFromAdmin.ensureObjectPermissions ||
    config(await getProjectPath()).ensureObjectPermissions.filter((el) => customObjectsFilter.includes(el));

  for (const file of profiles) {
    if (await fs.pathExists(file)) {
      const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));

      if (arrayEquals(data.Profile.custom, ['true'])) {
        if (!data.Profile.objectPermissions) {
          data.Profile['objectPermissions'] = [];
        }
        const injectedObjectPermission = [];
        ensureObjectPermissions.forEach((object) => {
          if (
            data.Profile.objectPermissions &&
            !data.Profile.objectPermissions.some((e) => compareobj(e.object, object))
          ) {
            injectedObjectPermission.push({
              allowCreate: ['false'],
              allowDelete: ['false'],
              allowEdit: ['false'],
              allowRead: ['false'],
              modifyAllRecords: ['false'],
              object,
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
        debug({
          profile: file,
          injectedObjectPermission: JSON.stringify(injectedObjectPermission),
          injectedUserPermission: JSON.stringify(injectedUserPermission),
        });
      }
    }
  }
}

async function mergeDirectories(source: string, destination: string): Promise<Array<{ from: string; to: string }>> {
  const files = await fs.readdir(source);
  let result = [];

  for (const file of files) {
    const sourceFile = path.join(source, file);
    const destinationFile = path.join(destination, file);
    if ((await fs.lstat(sourceFile)).isDirectory()) {
      result = result.concat(await mergeDirectories(sourceFile, destinationFile));
    } else {
      await fs.ensureDir(path.dirname(destinationFile));
      fs.writeFileSync(destinationFile, await fs.readFile(sourceFile));
      result.push({ from: sourceFile, to: destinationFile });
    }
  }
  return result;
}

export async function moveSourceFilesByFolder(): Promise<Array<{ from: string; to: string }>> {
  let f = [];
  const project = await getProjectPath();
  const moveSourceFolders = config(project).moveSourceFolders;

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

export async function logFixes(updatedfiles) {
  const root = await getProjectPath();
  Object.keys(updatedfiles).forEach((workaround) => {
    if (updatedfiles[workaround].length > 0) {
      cli.styledHeader(chalk.blue(`Fixed Source: ${workaround}`));
      cli.table(updatedfiles[workaround], {
        filePath: {
          header: 'FILEPATH',
          get: (row: fixResult) => path.relative(root, row.filePath),
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

export async function logMoves(movedSourceFiles) {
  if (movedSourceFiles.length > 0) {
    cli.styledHeader(chalk.blue('Moved Source Files'));
    const root = await getProjectPath();
    cli.table(movedSourceFiles, {
      from: {
        header: 'FROM',
        get: (row: { from: string; to: string }) => path.relative(root, row.from),
      },
      to: {
        header: 'TO',
        get: (row: { from: string; to: string }) => path.relative(root, row.to),
      },
    });
  }
}

export async function applySourceFixes(filter: string[]) {
  return await applyFixes(config(await getProjectPath()).sourceFix, null, filter);
}

export type aggregatedFixResults = {
  [workaround: string]: fixResults;
};

type fixResults = fixResult[];

type fixResult = { filePath: string; operation: string; message: string };

export async function applyFixes(tags, root?, filter = []): Promise<aggregatedFixResults> {
  if (!root) {
    root = await getProjectPath();
  }
  const updatedfiles: aggregatedFixResults = {};
  for (const tag of tags) {
    if (config(await getProjectPath())[tag]) {
      const c = config(await getProjectPath())[tag];
      for (const workarounds of Object.keys(c)) {
        for (const workaround of Object.keys(c[workarounds])) {
          if (c[workarounds][workaround].isactive === true) {
            if (c[workarounds][workaround].files) {
              if (c[workarounds][workaround].files.delete) {
                if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                  updatedfiles[workarounds + '/' + workaround] = [];
                }
                updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(
                  await sourcedelete(c[workarounds][workaround].files.delete, root, filter)
                );
              }
              if (c[workarounds][workaround].files.modify) {
                if (!Array.isArray(updatedfiles[workarounds + '/' + workaround])) {
                  updatedfiles[workarounds + '/' + workaround] = [];
                }
                updatedfiles[workarounds + '/' + workaround] = updatedfiles[workarounds + '/' + workaround].concat(
                  await sourcefix(c[workarounds][workaround].files.modify, root, filter)
                );
              }
            }
          }
        }
      }
    }
  }

  return updatedfiles;
}

async function sourcedelete(deletesources, root, filter): Promise<fixResults> {
  const array = [];
  deletesources = deletesources.map((el) => path.join(root, el));
  if (filter.length > 0) {
    deletesources = deletesources.filter((el) => filter.includes(el));
  }
  for (const filepath of deletesources) {
    debug(`delete file: ${filepath}`);
    if (await fs.pathExists(filepath)) {
      await fs.remove(filepath);
      array.push({ filePath: filepath, operation: 'deleteFile', message: '' });
    } else {
      debug(`${filepath} not found`);
    }
  }
  return array;
}

async function getConnectionFromArgv(): Promise<argvConnection> {
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
      } else {
        aliasOrUsername = argv.shift();
      }
    }
  }

  if (aliasOrUsername.length === 0) {
    const aggregator = await ConfigAggregator.create();
    aliasOrUsername = aggregator.getPropertyValue('defaultusername').toString();
  }

  const org = await Org.create({ aliasOrUsername });
  argvConnection = { instanceUrl: org.getConnection().instanceUrl, username: org.getConnection().getUsername() };
  return argvConnection;
}

// eslint-disable-next-line complexity
async function sourcefix(fixsources, root, filter): Promise<fixResults> {
  const array = [];
  for (const filename of Object.keys(fixsources)) {
    const fileOrGlobPath = path.join(root, filename);
    let files = await globby(fileOrGlobPath);
    if (filter.length > 0) {
      files = files.filter((el) => filter.includes(el));
    }
    for (const file of files) {
      if (await fs.pathExists(file)) {
        const data = await xml2js.parseStringPromise(await fs.readFile(file, 'utf8'));
        debug(`modify file: ${file}`);
        if (fixsources[filename].delete) {
          for (const deltask of fixsources[filename].delete) {
            const deltaskpaths = new ObjectPathResolver(data).resolveString(deltask).value();
            for (const deltaskpath of deltaskpaths.reverse()) {
              if (typeof deltaskpath !== 'undefined') {
                debug(`delete: ${deltaskpath}`);
                objectPath.del(data, deltaskpath);
                fs.writeFileSync(
                  file,
                  builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                );
                array.push({
                  filePath: file,
                  operation: 'delete',
                  message: deltask,
                });
              } else {
                debug(`delete: '${deltask.path} not found`);
              }
            }
          }
        }

        if (fixsources[filename].insert) {
          for (const inserttask of fixsources[filename].insert) {
            if (
              !objectPath
                .get(data, inserttask.path)
                .some((object) => JSON.stringify(object) === JSON.stringify(inserttask.object))
            ) {
              debug(`insert: ${JSON.stringify(inserttask.object)} at ${inserttask.path}`);
              objectPath.insert(data, inserttask.path, inserttask.object, inserttask.at);
              fs.writeFileSync(
                file,
                builder.buildObject(data) + '\n' // .replace(/ {2}/g, '    ')
              );
              array.push({
                filePath: file,
                operation: 'insert',
                message: `${JSON.stringify(inserttask.object)} at ${inserttask.path}`,
              });
            } else {
              debug(`insert: Object ${JSON.stringify(inserttask.object)} found at ${inserttask.path}`);
            }
          }
        }

        if (fixsources[filename].set) {
          for (const settask of fixsources[filename].set) {
            const settaskpaths = new ObjectPathResolver(data).resolveString(settask.path).value();

            for (const settaskpath of settaskpaths) {
              if (typeof settaskpath !== 'undefined') {
                if (settask.value) {
                  if (JSON.stringify(settask.value).includes('<mydomain>')) {
                    settask.value = JSON.parse(
                      JSON.stringify(settask.value).replace(
                        /<mydomain>/i,
                        (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[0]
                      )
                    );
                  }
                  if (JSON.stringify(settask.value).includes('<instance>')) {
                    settask.value = JSON.parse(
                      JSON.stringify(settask.value).replace(
                        /<mydomain>/i,
                        (await getConnectionFromArgv()).instanceUrl.substring(8).split('.')[1]
                      )
                    );
                  }
                  if (!compareobj(objectPath.get(data, settaskpath), settask.value)) {
                    debug(`Set: ${JSON.stringify(settask.value)} at ${settaskpath}`);
                    objectPath.set(data, settaskpath, settask.value);
                    fs.writeFileSync(
                      file,
                      builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                    );
                    array.push({
                      filePath: file,
                      operation: 'set',
                      message: `${settask.path} => ${JSON.stringify(settask.value)}`,
                    });
                  }
                } else if (typeof settask.object === 'object') {
                  const validate = async (node) => {
                    const replaceArray = [];
                    const recursive = (n, attpath) => {
                      // eslint-disable-next-line guard-for-in
                      for (const attributename in n) {
                        if (attpath.length === 0) {
                          attpath = attributename;
                        } else {
                          attpath = attpath + '.' + attributename;
                        }
                        if (typeof n[attributename] === 'object') {
                          recursive(n[attributename], attpath);
                        } else {
                          if (n[attributename] === '<username>') {
                            replaceArray.push([n[attributename], attpath]);
                          }
                        }
                      }
                    };
                    recursive(node, '');
                    for (const element of replaceArray) {
                      if (element[0] === '<username>') {
                        objectPath.set(node, element[1], (await getConnectionFromArgv()).username);
                      }
                    }
                    return node;
                  };

                  settask.object = await validate(settask.object);
                  debug(`set: ${JSON.stringify(settask.object)} at ${settaskpath}`);
                  if (settask.object) {
                    for (const k of Object.keys(settask.object)) {
                      debug(settaskpath + '.' + k);
                      if (objectPath.has(data, settaskpath + '.' + k)) {
                        debug(settask.object[k]);
                        objectPath.set(data, settaskpath + '.' + k, settask.object[k]);
                        debug(objectPath.get(data, settaskpath));
                      }
                    }
                  } else {
                    objectPath.insert(data, settaskpath, settask.object);
                  }

                  fs.writeFileSync(
                    file,
                    builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
                  );
                  array.push({
                    filePath: file,
                    operation: 'set',
                    message: `${settask.path} ==> ${JSON.stringify(settask.object)}`,
                  });
                } else {
                  debug(`Set: value ${JSON.stringify(settask.value)} found at ${settaskpath}`);
                }
              }
            }
          }
        }

        if (fixsources[filename].fixflowtranslation) {
          const flowDefinitions = objectPath.get(data, 'Translations.flowDefinitions');
          for (const flowDefinition of flowDefinitions) {
            const fullname = objectPath.get(
              data,
              `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`
            );
            if (fullname.lastIndexOf('-') > 0) {
              debug(`fixflowtranslation: ${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))}`);
              objectPath.set(
                data,
                `Translations.flowDefinitions.${flowDefinitions.indexOf(flowDefinition)}.flows.0.fullName.0`,
                fullname.substring(0, fullname.lastIndexOf('-'))
              );
              fs.writeFileSync(
                file,
                builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
              );
              array.push({
                filePath: file,
                operation: 'fix',
                message: `(${fullname} => ${fullname.substring(0, fullname.lastIndexOf('-'))})`,
              });
            } else {
              debug(`fixflowtranslation: ${fullname} already fixed`);
            }
          }
        }
      } else {
        debug(`modify file: ${file} not found`);
      }
    }
  }
  return array;
}

export async function updateProfiles(profiles, retrievePackageDir, forceSourcePull) {
  if (forceSourcePull) {
    debug('force:source:pull detected');
    const packageProfilesOnly = path.join(__dirname, '..', '..', '..', 'manifest', 'package-profiles-only.xml');
    const retrieveDir = path.join(retrievePackageDir, '..');
    debug({ packageProfilesOnly, retrieveDir });
    let stdout;
    try {
      stdout = (
        await execa('sfdx', [
          'force:mdapi:retrieve',
          '--retrievetargetdir',
          path.join(retrieveDir, 'reRetrieveProfiles'),
          '--unpackaged',
          packageProfilesOnly,
          '--json',
        ])
      ).stdout;
    } catch (e) {
      debug(e);
      stdout = { status: 1 };
    }
    stdout = JSON.parse(stdout);
    if (stdout.status === 0) {
      debug({ zipFilePath: stdout.result.zipFilePath });
      const zip = new AdmZip(stdout.result.zipFilePath);
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
    profileElementInjectionFromAdmin.ensureObjectPermissions = (
      await xml2js.parseStringPromise(await fs.readFile(adminprofile, 'utf8'))
    ).Profile.objectPermissions.map((el) => el.object.toString());
  } else {
    const manifest = await xml2js.parseStringPromise(
      await fs.readFile(path.join(retrievePackageDir, 'package.xml'), 'utf8')
    );
    customObjectsFilter = manifest.Package.types
      .filter((el) => el.name.toString() === 'CustomObject')
      .map((el) => el.members)
      .flat();
  }
  debug({ profiles, profileElementInjectionFromAdmin, customObjectsFilter });
  await profileElementInjection(profiles, profileElementInjectionFromAdmin, customObjectsFilter);
}
