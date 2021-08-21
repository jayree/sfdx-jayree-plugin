/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename, sep, posix, dirname } from 'path';
import { EOL } from 'os';
import execa from 'execa';
import equal from 'fast-deep-equal';
import {
  ComponentSet,
  RegistryAccess,
  VirtualDirectory,
  VirtualTreeContainer,
} from '@salesforce/source-deploy-retrieve';
import {
  NodeFSTreeContainer as FSTreeContainer,
  MetadataResolver,
} from '@salesforce/source-deploy-retrieve/lib/src/resolve';
import { ComponentLike } from '@salesforce/source-deploy-retrieve/lib/src/resolve/types';

export const NodeFSTreeContainer = FSTreeContainer;

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const debug = require('debug')('jayree:manifest:git:diff');

// eslint-disable-next-line import/order
import { deepFreeze } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import * as registryData from '../../metadata/registry.json';

const registry = deepFreeze(registryData);
const registryAccess = new RegistryAccess(registry);

// const registryAccess = new RegistryAccess();

export interface Ctx {
  projectRoot: string;
  sfdxProjectFolders: string[];
  sourceApiVersion: string;
  gitLines: Array<{ path: string; status: string }>;
  gitResults: {
    added: string[];
    deleted: string[];
    modified: {
      destructiveFiles: string[];
      manifestFiles: string[];
      toDestructiveChanges: Record<string, []>;
      toManifest: Record<string, []>;
    };
  };
  ref1VirtualTreeContainer: VirtualTreeContainer;
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer;
  destructiveChangesComponentSet: ComponentSet;
  manifestComponentSet: ComponentSet;
  git: {
    ref1: string;
    ref2: string;
    ref1ref2: string;
  };
  destructiveChanges: {
    files: string[];
  };
  manifest: {
    file: string;
  };
}

export async function createVirtualTreeContainer(ref, modifiedFiles) {
  debug({ modifiedFiles });
  const { stdout } = await execa('git', ['ls-tree', '-r', '--name-only', ref]);
  const virtualFs: VirtualDirectory[] = [];
  for (const path of stdout.split(EOL)) {
    let dirPath;
    let subPath = path;
    while (dirPath !== dirname(subPath)) {
      dirPath = dirname(subPath);
      const index = virtualFs.findIndex((dir) => dir.dirPath === dirPath);
      if (index >= 0) {
        virtualFs[index].children.push({
          name: basename(subPath),
          data:
            parseMetadataXml(subPath) && modifiedFiles.includes(subPath)
              ? Buffer.from((await execa('git', ['--no-pager', 'show', `${ref}:${subPath}`])).stdout)
              : Buffer.from(''),
        });
      } else {
        virtualFs.push({
          dirPath,
          children: [
            {
              name: basename(subPath),
              data:
                parseMetadataXml(subPath) && modifiedFiles.includes(subPath)
                  ? Buffer.from((await execa('git', ['--no-pager', 'show', `${ref}:${subPath}`])).stdout)
                  : Buffer.from(''),
            },
          ],
        });
      }
      subPath = dirPath;
    }
  }
  return new VirtualTreeContainer(virtualFs);
}

function parseMetadataXml(fsPath: string) {
  const match = /(.+)\.(.+)-meta\.xml/.exec(basename(fsPath));
  if (match) {
    return { fullName: match[1], suffix: match[2], path: fsPath };
  }
}

export function analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
  let source = '';
  let target = '';
  if (parseMetadataXml(path)) {
    try {
      const ref2resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
      const ref2Component = ref2resolver.getComponentsFromPath(path);
      if (ref2Component.length === 1) {
        // debug({ ref2Component: ref2Component[0].getChildren() });
        source = ref2Component[0].parseXmlSync();
      }
    } catch (error) {
      debug({ error });
      source = '';
    }

    try {
      const ref1resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
      const ref1Component = ref1resolver.getComponentsFromPath(path);
      if (ref1Component.length === 1) {
        // debug({ ref1Component: ref1Component[0].getChildren() });
        target = ref1Component[0].parseXmlSync();
      }
    } catch (error) {
      debug({ error });
      target = '';
    }
  }

  if (equal(target, source) && source !== '' && target !== '') {
    return { status: -1 };
  } else if (source === '' && target === '') {
    return { status: 0 };
  }

  const XmlName = ((objects) => {
    for (const obj of objects) {
      if (typeof obj !== 'undefined' && obj !== null) {
        return Object.keys(obj)[0];
      }
    }
    return '';
  })([target, source]);

  const XmlTypesOfXmlName = ((xmlName) => {
    try {
      const childTypeMapping = {};
      Object.values(registryAccess.getTypeByName(xmlName).children.types).forEach((element) => {
        childTypeMapping[element.directoryName] = element.name;
      });
      return childTypeMapping;
    } catch (error) {
      return {};
    }
  })(XmlName);

  if (Object.keys(XmlTypesOfXmlName).length === 0) {
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
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const path = n.path.concat(k);
          if (path.includes('fullName')) {
            const fullName = n.obj[k];
            path.pop();
            paths.push({ path, fullName });
          }
          nodes.unshift({
            obj: n.obj[k],
            path,
          });
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

export async function getGitDiff(sfdxProjectFolders, ref1ref2) {
  let gitLines = (await execa('git', ['--no-pager', 'diff', '--name-status', '--no-renames', ref1ref2])).stdout.split(
    /\r?\n/
  );

  gitLines = gitLines.filter((l) =>
    sfdxProjectFolders.some((f) => {
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
      for (const sfdxFolder of sfdxProjectFolders) {
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
  return gitlinesf;
}

export function getGitResults(
  task,
  gitLines,
  ref1VirtualTreeContainer,
  ref2VirtualTreeContainer
): {
  added: string[];
  modified: {
    destructiveFiles: string[];
    manifestFiles: string[];
    toManifest: Record<string, []>;
    toDestructiveChanges: Record<string, []>;
  };
  deleted: string[];
  unchanged: string[];
} {
  const results = {
    added: [],
    modified: { destructiveFiles: [], manifestFiles: [], toManifest: {}, toDestructiveChanges: {} },
    deleted: [],
    unchanged: [],
  };

  for (const [i, { status, path }] of gitLines.entries()) {
    const check = analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
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
      if (Object.keys(check.toDestructiveChanges).length) {
        results.modified.destructiveFiles.push(path);
      } else if (!Object.keys(check.toDestructiveChanges).length && Object.keys(check.toManifest).length) {
        results.modified.manifestFiles.push(path);
      }
      Object.keys(check).forEach((to) => {
        Object.keys(check[to]).forEach((md) => {
          results.modified[to] = results.modified[to] ?? {};
          results.modified[to][md] = results.modified[to][md] ?? [];
          results.modified[to][md] = results.modified[to][md].concat(check[to][md]);
        });
      });
    } else if (check.status === -1) {
      results.unchanged.push(path);
    }
    task.output = `${i + 1}/${gitLines.length} files processed
Added: ${results.added.length} Deleted: ${results.deleted.length} Modified: ${
      [...results.modified.destructiveFiles, ...results.modified.manifestFiles].length
    } Unchanged: ${results.unchanged.length}`;
  }

  return results;
}

export function createManifest(
  virtualTreeContainer,
  options: { destruct: boolean } = { destruct: false },
  results,
  task
): ComponentSet {
  let metadata;
  let sourcepath;
  if (options.destruct) {
    metadata = results.modified.toDestructiveChanges;
    sourcepath = results.deleted;
  } else {
    metadata = results.modified.toManifest;
    sourcepath = results.added;
  }

  const Aggregator: ComponentLike[] = [];

  // const fromSourcePath = ComponentSet.fromSource({
  //   fsPaths: sourcepath,
  //   registry: registryAccess,
  //   tree: virtualTreeContainer,
  // });

  const fromSourcePath = new ComponentSet();
  const resolver = new MetadataResolver(registryAccess, virtualTreeContainer);
  for (const path of sourcepath) {
    for (const component of resolver.getComponentsFromPath(path)) {
      if (['CustomFieldTranslation'].includes(component.type.name)) {
        if (!options.destruct) {
          task.output = `'${component.type.name}:${component.fullName}' replaced with '${component.parent.type.name}:${component.parent.fullName}' in package manifest`;
          fromSourcePath.add(component.parent);
        } else {
          task.output = `'${component.type.name}:${component.fullName}' removed from destructiveChanges manifest`;
        }
      } else {
        fromSourcePath.add(component);
      }
    }
  }
  debug({ fromSourcePath });

  Aggregator.push(...fromSourcePath);

  const replaceChildwithParentType = (type, fullName) => {
    const lower = type.toLowerCase().trim();
    if (
      !options.destruct &&
      registry.childTypes[lower] &&
      [
        'AssignmentRule',
        'AutoResponseRule',
        'EscalationRule',
        'MatchingRule',
        'SharingOwnerRule',
        'SharingCriteriaRule',
        'SharingGuestRule',
        'SharingTerritoryRule',
        'WorkflowFieldUpdate',
        'WorkflowKnowledgePublish',
        'WorkflowTask',
        'WorkflowAlert',
        'WorkflowSend',
        'WorkflowOutboundMessage',
        'WorkflowRule',
      ].includes(type)
    ) {
      const parentType = registryAccess.getTypeByName(registry.childTypes[lower]);
      const parentFullName = fullName.split('.').slice(0, 1).toString();
      task.output = `'${type}:${fullName}' replaced with '${parentType.name}:${parentFullName}' in package manifest`;
      return {
        type: parentType,
        fullName: parentFullName,
      };
    }
    return { type: registryAccess.getTypeByName(type), fullName };
  };

  const filter = new ComponentSet();

  for (const type of Object.keys(metadata)) {
    for (const fullName of metadata[type]) {
      debug({ type, fullName });
      filter.add(replaceChildwithParentType(type, fullName));
    }
  }

  const fromMetadata = ComponentSet.fromSource({
    fsPaths: ['.'],
    registry: registryAccess,
    tree: virtualTreeContainer,
    include: filter,
  });

  debug({ fromMetadata, filter, options });
  const finalized = fromMetadata.size > 0 ? fromMetadata : filter;
  Aggregator.push(...finalized);

  const pkg = new ComponentSet(Aggregator, registryAccess);
  return pkg;
}
