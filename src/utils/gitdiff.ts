/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename, sep, posix, dirname } from 'path';
import execa from 'execa';
import equal from 'fast-deep-equal';
import {
  ComponentSet,
  RegistryAccess,
  VirtualDirectory,
  VirtualTreeContainer,
  SourceComponent,
  NodeFSTreeContainer as FSTreeContainer,
  MetadataResolver,
  VirtualFile,
} from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils';

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
    manifest: ComponentSet;
    destructiveChanges: ComponentSet;
    unchanged: string[];
    ignored: { ref1: string[]; ref2: string[] };
    counts: { added: number; deleted: number; modified: number; unchanged: number; ignored: number; error: number };
    errors: string[];
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

export function ensureOSPath(path: string) {
  return path.split(posix.sep).join(sep);
}

export function ensureGitPath(path: string) {
  return path.split(sep).join(posix.sep);
}

export async function createVirtualTreeContainer(ref: string, modifiedFiles: string[]): Promise<VirtualTreeContainer> {
  const paths = (await execa('git', ['ls-tree', '-r', '--name-only', ref])).stdout
    .split(/\r?\n/)
    .map((p) => ensureOSPath(p));
  const virtualFsSet = new Map<string, Set<VirtualFile | string>>();
  debug({ modifiedFiles });
  for (const path of paths) {
    let dirOrFilePath = path;
    while (dirOrFilePath !== dirname(dirOrFilePath)) {
      const fileOrFolderName = basename(dirOrFilePath);
      dirOrFilePath = dirname(dirOrFilePath);
      if (!virtualFsSet.has(dirOrFilePath)) {
        virtualFsSet.set(dirOrFilePath, new Set());
      }
      if (path.endsWith(fileOrFolderName)) {
        const data =
          parseMetadataXml(path) && modifiedFiles.includes(path)
            ? Buffer.from((await execa('git', ['--no-pager', 'show', `${ref}:${ensureGitPath(path)}`])).stdout)
            : Buffer.from('');
        virtualFsSet.get(dirOrFilePath).add({ name: fileOrFolderName, data });
      } else {
        virtualFsSet.get(dirOrFilePath).add(fileOrFolderName);
      }
    }
  }
  const virtualFs: VirtualDirectory[] = [];
  for (const [dirPath, childSet] of virtualFsSet) {
    virtualFs.push({ dirPath, children: [...childSet] });
  }
  return new VirtualTreeContainer(virtualFs);
}

export async function analyzeFile(
  path: string,
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<{
  status: number;
  toManifest?: SourceComponent[];
  toDestructiveChanges?: SourceComponent[];
}> {
  if (!parseMetadataXml(path)) {
    return { status: 0 };
  }

  const ref2resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
  const [ref2Component] = ref2resolver.getComponentsFromPath(path); // git path only conaints files

  const ref1resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const [ref1Component] = ref1resolver.getComponentsFromPath(path); // git path only conaints files

  if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
    return { status: -1 };
  }

  if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
    return { status: 0 };
  }

  const SourceComponentNotInSource = ref1Component.getChildren().filter(
    (x) =>
      !ref2Component
        .getChildren()
        .map((f) => {
          return getUniqueIdentifier(f);
        })
        .includes(getUniqueIdentifier(x))
  ); // deleted
  const SourceComponentNotInTarget = ref2Component.getChildren().filter(
    (x) =>
      !ref1Component
        .getChildren()
        .map((f) => {
          return getUniqueIdentifier(f);
        })
        .includes(getUniqueIdentifier(x))
  ); // added
  const SourceComponentInSourceAndTarget = ref1Component.getChildren().filter((x) =>
    ref2Component
      .getChildren()
      .map((f) => {
        return getUniqueIdentifier(f);
      })
      .includes(getUniqueIdentifier(x))
  ); // modified?

  debug({ SourceComponentNotInSource, SourceComponentNotInTarget, SourceComponentInSourceAndTarget });

  for (const x of SourceComponentInSourceAndTarget) {
    const [y] = ref2Component.getChildren().filter((f) => getUniqueIdentifier(x) === getUniqueIdentifier(f));
    if (!equal(await x.parseXml(), await y.parseXml())) {
      SourceComponentNotInTarget.push(y); // modified! -> add to added
    }
  }

  debug({ SourceComponentNotInTarget });

  return {
    status: SourceComponentNotInSource.length + SourceComponentNotInTarget.length,
    toManifest: SourceComponentNotInTarget,
    toDestructiveChanges: SourceComponentNotInSource,
  };
}

function getUniqueIdentifier(component: SourceComponent) {
  return `${component.type.name}#${component[component.type.uniqueIdElement]}`;
}

export async function getGitDiff(sfdxProjectFolders: string[], ref1ref2: string): Promise<Ctx['gitLines']> {
  let gitLines = (await execa('git', ['--no-pager', 'diff', '--name-status', '--no-renames', ref1ref2])).stdout
    .split(/\r?\n/)
    .map((line) => {
      const l = line.split('\t');
      return { path: ensureOSPath(l[1]), status: l[0] };
    })
    .filter((l) =>
      sfdxProjectFolders.some((f) => {
        return l.path.startsWith(f);
      })
    );

  const renames = [];
  gitLines = gitLines.filter((line) => {
    if (line.status === 'D') {
      for (const sfdxFolder of sfdxProjectFolders) {
        const defaultFolder = join(sfdxFolder, 'main', 'default');
        const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
        const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
        if (target) {
          renames.push({ from: line.path, to: target.path });
          return false;
        }
      }
    }
    return true;
  });
  debug({ gitLines, renames, sfdxProjectFolders });
  return gitLines;
}

export async function getGitResults(
  gitLines: Ctx['gitLines'],
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<Ctx['gitResults']> {
  const results = {
    manifest: new ComponentSet(undefined, registryAccess),
    destructiveChanges: new ComponentSet(undefined, registryAccess),
    unchanged: [],
    ignored: { ref1: [], ref2: [] },
    counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
    errors: [],
  };
  const ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const ref2Resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);

  for (const [, { status, path }] of gitLines.entries()) {
    if (status === 'D') {
      for (const c of ref1Resolver.getComponentsFromPath(path)) {
        if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
          results.destructiveChanges.add(c, true);
          results.counts.deleted++;
        } else {
          try {
            ref2Resolver.getComponentsFromPath(c.xml);
            results.manifest.add(c);
            results.counts.added++;
          } catch (error) {
            results.counts.error++;
            results.errors.push(error.message);
          }
        }
      }
    } else if (status === 'A') {
      for (const c of ref2Resolver.getComponentsFromPath(path)) {
        results.manifest.add(c);
        results.counts.added++;
      }
    } else {
      const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
      if (check.status === 0) {
        for (const c of ref2Resolver.getComponentsFromPath(path)) {
          results.manifest.add(c);
          results.counts.added++;
        }
      } else if (check.status === -1) {
        results.unchanged.push(path);
        results.counts.unchanged++;
      } else {
        results.counts.modified++;
        for (const c of check.toDestructiveChanges) {
          results.destructiveChanges.add(c, true);
        }
        for (const c of check.toManifest) {
          results.manifest.add(c);
        }
      }
    }
  }

  results.ignored = {
    ref1: Array.from(ref1Resolver.forceIgnoredPaths),
    ref2: Array.from(ref2Resolver.forceIgnoredPaths),
  };
  results.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;

  return results;
}

export function buildManifestComponentSet(cs: ComponentSet, forDestructiveChanges = false): ComponentSet {
  // SDR library is more strict and avoids fixes like this
  if (!forDestructiveChanges) {
    const missingParents = cs.find((c) => ['CustomFieldTranslation'].includes(c.type.name))?.parent;
    if (missingParents) {
      debug({ missingParents });
      cs.add(missingParents);
    }
  }

  return cs;
}
