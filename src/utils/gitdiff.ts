/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, dirname, basename, relative, sep, posix } from 'path';
import * as util from 'util';
import * as fs from 'fs-extra';
import execa from 'execa';
import equal from 'fast-deep-equal';
import * as xml2js from 'xml2js';
import * as describe from '../../metadata/describe.json';

const builder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  xmlns: true,
  renderOpts: { pretty: true, indent: '  ', newline: '\n' },
});

const parseString = util.promisify(xml2js.parseString);

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const debug = require('debug')('jayree:manifest:git:diff');

export interface Ctx {
  tmpbasepath: string;
  projectRoot: string;
  sfdxProjectFolders: string[];
  sfdxProject: { packageDirectories: [{ path: string }]; sourceApiVersion: string };
  // eslint-disable-next-line @typescript-eslint/ban-types
  gitResults: {
    added: string[];
    deleted: string[];
    modified: { toDestructiveChanges: Record<string, []>; toManifest: Record<string, []> };
  };
  destructiveChangesProjectPath: string;
  manifestProjectPath: string;
  destructiveChangesManifestFile: string;
  manifestFile: string;
  destructiveChangesSourceFiles: string[];
  manifestSourceFiles: string[];
  git: {
    ref1: string;
    ref2: string;
    ref1ref2: string;
  };
  destructiveChanges: {
    content: Record<string, unknown>;
    files: string[];
  };
  manifest: {
    content: Record<string, unknown>;
    file: string;
  };
  warnings: Record<string, Record<string, string[]>>;
}

export async function ensureDirsInTempProject(basePath: string, ctx: Ctx) {
  for (const folder of ctx.sfdxProjectFolders) {
    await fs.ensureDir(join(basePath, folder));
  }
}

export async function prepareTempProject(type: string, ctx: Ctx) {
  const tmpProjectPath = join(ctx.tmpbasepath, type);
  await fs.ensureDir(ctx.tmpbasepath);
  await fs.copy(join(ctx.projectRoot, 'sfdx-project.json'), join(tmpProjectPath, 'sfdx-project.json'));
  await fs.copy(join(ctx.projectRoot, '.forceignore'), join(tmpProjectPath, '.forceignore'));
  await ensureDirsInTempProject(tmpProjectPath, ctx);
  return tmpProjectPath;
}

export async function addFilesToTempProject(tmpRoot, paths, task, ctx: Ctx): Promise<string[]> {
  const addedFiles = [];
  for (const path of paths) {
    const file = join(tmpRoot, path);
    task.output = path;
    await fs.ensureDir(join(tmpRoot, dirname(path)));
    const content = (async () => {
      try {
        return (await execa('git', ['--no-pager', 'show', `${ctx.git.ref2}:${path}`])).stdout;
      } catch (error) {
        return (await execa('git', ['--no-pager', 'show', `${ctx.git.ref1}:${path}`])).stdout;
      }
    })();
    await fs.writeFile(file, await content);
    addedFiles.push(file);
  }
  return addedFiles;
}

// eslint-disable-next-line complexity
export async function convertTempProject(
  convertpath: string,
  options: { destruct: boolean } = { destruct: false },
  task,
  ctx: Ctx
): Promise<string> {
  let result;
  do {
    try {
      result = await execa(
        'sfdx',
        ['force:source:convert', '--sourcepath', ctx.sfdxProjectFolders.toString(), '--json'],
        {
          cwd: convertpath,
        }
      );
    } catch (e) {
      result = e;
    }
    debug({ forceSourceConvertResult: result });
    result = JSON.parse(result.stdout);
    if (result.status === 1) {
      if (
        result.name === 'Missing Metadata File' ||
        result.name === 'MissingContentOrMetadataFile' ||
        result.name === 'MissingComponentOrResource'
      ) {
        let path;
        if (result.name === 'Missing Metadata File') {
          path = result.message.split("Expected metadata file with '-meta.xml' extension at path: ")[1];
        }
        if (result.name === 'MissingContentOrMetadataFile') {
          path = result.message.split('Expected file at path: ')[1];
        }
        if (result.name === 'MissingComponentOrResource') {
          path = result.message.split(' exists and is correct, and try again.')[0].split(sep).slice(1).join(posix.sep);
          let componentOrResource;
          if (path.endsWith('.resource')) {
            componentOrResource = '.resource';
          } else if (path.endsWith('.component')) {
            componentOrResource = '.component';
          }
          path = path.split(componentOrResource)[0];
          const gitLines = (
            await execa('git', ['--no-pager', 'log', '--name-only', '--pretty=format:', '--', `*${path}*`])
          ).stdout.split(/\r?\n/);
          debug({ MissingComponentOrResourceLogResult: gitLines });
          path = Array.from(new Set(gitLines.filter(Boolean))).filter(
            (f) => !f.endsWith(`${componentOrResource}-meta.xml`)
          )[0];
          debug({ MissingComponentOrResourceLogResultPath: path });
          path = join(convertpath, path);
        }
        const relpath = relative(convertpath, path).split(sep).join(posix.sep);
        debug({ path, convertpath, relpath });
        if (!options.destruct) {
          task.output = `add missing file ${relpath}`;
          await fs.ensureDir(join(convertpath, dirname(relpath)));
          const { stdout } = await execa('git', ['--no-pager', 'show', `${ctx.git.ref2}:${relpath}`]);
          await fs.writeFile(path, stdout);
        } else {
          const arrayOfPath = [...relpath];
          let files = [];
          do {
            arrayOfPath.pop();
            files = ctx.gitResults.deleted.filter((p) => p.startsWith(arrayOfPath.join('')));
          } while (arrayOfPath.length > 0 && files.length === 0);
          await fs.remove(join(convertpath, files[0]));
          ctx.gitResults.added.push(files[0]);
          ctx.gitResults.deleted.splice(ctx.gitResults.deleted.indexOf(files[0]), 1);
          ctx.destructiveChangesSourceFiles.splice(ctx.destructiveChangesSourceFiles.indexOf(files[0]), 1);
          ctx.warnings[result.name] = ctx.warnings[result.name] ?? {};
          ctx.warnings[result.name][relpath] = ctx.warnings[result.name][relpath] ?? [];
          ctx.warnings[result.name][relpath].push(files[0]);
          task.output = `moved file ${files[0]} from destructiveChanges to manifest`;
        }
      } else if (result.name === 'UnexpectedFileFound') {
        const path = result.message.split('Unexpected file found in package directory: ')[1];
        const relpath = relative(convertpath, path);
        task.output = `removed file ${relpath}`;
        await fs.remove(join(convertpath, relpath));
      } else if (result.message === 'The package root directory is empty.') {
        result.status = 0;
        result.result = { location: convertpath };
      } else if (result.message.startsWith('No matching source was found within the package root directory')) {
        result.status = 0;
        result.result = { location: convertpath };
      } else {
        throw new Error(`No error handler for: '${result.name}' - ${result.message}`);
      }
    }
  } while (result.status === 1);

  const packagexml = join(result.result.location, 'package.xml');
  if (await fs.pathExists(packagexml)) {
    return packagexml;
  }
  return null;
}

export async function appendToManifest(file, insert): Promise<Record<string, unknown>> {
  const packagexmlJson = await parseString(await fs.readFile(file, 'utf8'));
  const types = {};

  if (packagexmlJson.Package.types) {
    packagexmlJson.Package.types.forEach((t) => {
      if (JSON.stringify(t['members']) !== JSON.stringify(['*'])) {
        types[t['name']] = t['members'];
      }
    });
  }

  Object.keys(insert).forEach((md) => {
    types[md] = types[md] ?? [];
    types[md] = types[md].concat(insert[md]);
  });

  const newtypes = [];
  Object.keys(types)
    .sort()
    .forEach((md) => {
      newtypes.push({ name: md, members: types[md].sort() });
    });

  packagexmlJson.Package.types = newtypes;

  await fs.writeFile(file, builder.buildObject(packagexmlJson));

  return packagexmlJson;
}

export async function analyzeFile(path, ctx: Ctx) {
  let source;
  try {
    const filecontent = (await execa('git', ['--no-pager', 'show', `${ctx.git.ref2}:${path}`])).stdout;
    source = await parseString(filecontent);
  } catch (error) {
    source = undefined;
  }

  let target;
  try {
    const filecontent = (await execa('git', ['--no-pager', 'show', `${ctx.git.ref1}:${path}`])).stdout;
    target = await parseString(filecontent);
  } catch (error) {
    target = undefined;
  }

  if (equal(target, source) && typeof source !== 'undefined' && typeof target !== 'undefined') {
    return { status: -1 };
  }

  const XmlName = ((objects) => {
    for (const obj of objects) {
      if (typeof obj !== 'undefined' && obj !== null) {
        return Object.keys(obj)[0];
      }
    }
    return [];
  })([target, source]);

  const XmlTypesOfXmlName = ((xmlName) => {
    const metadata = describe.metadataObjects.filter((md) => md.xmlName === xmlName);
    if (metadata[0] && metadata[0].childXmlNames) {
      return (metadata[0].childXmlNames as unknown) as [];
    }
    return [];
  })(XmlName);

  if (XmlTypesOfXmlName.length === 0) {
    return { status: 0 };
  }

  const PrefixOfFile = ((filePath, xmlName) => {
    let prefix = null;
    const parentObjectName = basename(filePath).split('.')[0];
    if (parentObjectName !== xmlName) {
      prefix = parentObjectName;
    }
    return prefix;
  })(path, XmlName);

  const getFullNamePaths = (root) => {
    const paths = [];
    const nodes = [
      {
        obj: root,
        path: [],
      },
    ];
    while (nodes.length > 0) {
      const n = nodes.pop();
      if (typeof n.obj === 'object') {
        Object.keys(n.obj).forEach((k) => {
          if (typeof n.obj[k] === 'object') {
            // eslint-disable-next-line no-shadow
            const path = n.path.concat(k);
            if (path.includes('fullName')) {
              const fullName = n.obj[k];
              path.pop();
              paths.push({ path, fullName: fullName[0] });
            }
            nodes.unshift({
              obj: n.obj[k],
              path,
            });
          }
        });
      }
    }
    return paths;
  };

  const targetFullNamePaths = getFullNamePaths(target);
  const sourceFullNamePaths = getFullNamePaths(source);

  const fullNamePathsNotInSource = targetFullNamePaths.filter(
    (x) => !sourceFullNamePaths.map((f) => f.fullName).includes(x.fullName)
  ); // deleted
  const fullNamePathsNotInTarget = sourceFullNamePaths.filter(
    (x) => !targetFullNamePaths.map((f) => f.fullName).includes(x.fullName)
  ); // added

  const fullNamePathsInSourceAndTarget = targetFullNamePaths.filter((x) =>
    sourceFullNamePaths.map((f) => f.fullName).includes(x.fullName)
  ); // modified?

  const getObjectAtPath = (diffPath, object) => {
    let current = object;
    for (const value of diffPath) {
      current = current[value];
    }
    return current;
  };

  for (const x of fullNamePathsInSourceAndTarget) {
    const y = sourceFullNamePaths.filter((f) => x.fullName === f.fullName)[0];
    if (!equal(getObjectAtPath(x.path, target), getObjectAtPath(y.path, source))) {
      fullNamePathsNotInTarget.push({ fullName: x.fullName, path: x.path }); // modified! -> add to added
    }
  }

  const getXmlType = (object, XmlTypes) => {
    return object.path
      .filter((p) => typeof p === 'string')
      .map((pv) => XmlTypes[pv])
      .filter(Boolean);
  };

  const convert = (array, XmlTypes) => {
    const converted = {};
    array.forEach((e) => {
      const childXmlType = getXmlType(e, XmlTypes);
      if (childXmlType) {
        converted[childXmlType] = converted[childXmlType] ?? [];
        if (PrefixOfFile) {
          converted[childXmlType].push(`${PrefixOfFile}.${e.fullName}`);
        } else {
          converted[childXmlType].push(e.fullName);
        }
      }
    });
    return converted;
  };

  const toDestructiveChanges = convert(fullNamePathsNotInSource, XmlTypesOfXmlName);
  const toManifest = convert(fullNamePathsNotInTarget, XmlTypesOfXmlName);

  return {
    status: Object.keys(toManifest).length + Object.keys(toDestructiveChanges).length,
    toManifest,
    toDestructiveChanges,
  };
}

export async function getGitResults(
  task,
  ctx: Ctx
): Promise<{
  added: string[];
  modified: { toManifest: Record<string, []>; toDestructiveChanges: Record<string, []> };
  deleted: string[];
}> {
  const results = {
    added: [],
    modified: { files: [], toManifest: {}, toDestructiveChanges: {} },
    deleted: [],
    skipped: [],
  };

  let gitLines = (
    await execa('git', ['--no-pager', 'diff', '--name-status', '--no-renames', ctx.git.ref1ref2])
  ).stdout.split(/\r?\n/);

  gitLines = gitLines.filter((l) =>
    ctx.sfdxProjectFolders.some((f) => {
      if (typeof l.split('\t')[1] !== 'undefined') {
        return l.split('\t')[1].startsWith(f);
      }
    })
  );

  let gitlinesf = gitLines.map((line) => {
    const l = line.split('\t');
    return { path: l[1], status: l[0] };
  });

  gitlinesf = gitlinesf.filter((line) => {
    if (line.status === 'D') {
      for (const sfdxFolder of ctx.sfdxProjectFolders) {
        let extf;
        if (line.path.startsWith(sfdxFolder)) {
          extf = sfdxFolder;
          if (line.path.startsWith(join(sfdxFolder, '/main/default/').split(sep).join(posix.sep))) {
            extf = join(sfdxFolder, '/main/default/').split(sep).join(posix.sep);
          } else {
            extf = join(sfdxFolder, '/').split(sep).join(posix.sep);
          }
          if (gitlinesf.filter((t) => t.path.endsWith(line.path.replace(extf, '')) && t.status === 'A').length !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  });

  for (const [i, { status, path }] of gitlinesf.entries()) {
    const check = await analyzeFile(path, ctx);
    if (check.status === 0) {
      switch (status) {
        case 'D': {
          results.deleted.push(path);
          break;
        }
        default: {
          results.added.push(path);
          break;
        }
      }
    } else if (check.status > 0) {
      results.modified.files.push(path);
      Object.keys(check).forEach((to) => {
        Object.keys(check[to]).forEach((md) => {
          results.modified[to] = results.modified[to] ?? {};
          results.modified[to][md] = results.modified[to][md] ?? [];
          results.modified[to][md] = results.modified[to][md].concat(check[to][md]);
        });
      });
    } else if (check.status === -1) {
      results.skipped.push(path);
    }
    task.output = `${i + 1}/${gitlinesf.length} files processed (${results.skipped.length} skipped):
Added: ${results.added.length} Deleted: ${results.deleted.length} Modified: ${results.modified.files.length}`;
  }
  return results;
}
