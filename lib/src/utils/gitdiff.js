"use strict";
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManifest = exports.getGitResults = exports.getGitDiff = exports.analyzeFile = exports.createVirtualTreeContainer = exports.debug = exports.NodeFSTreeContainer = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const os_1 = require("os");
const execa_1 = tslib_1.__importDefault(require("execa"));
const fast_deep_equal_1 = tslib_1.__importDefault(require("fast-deep-equal"));
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const resolve_1 = require("@salesforce/source-deploy-retrieve/lib/src/resolve");
exports.NodeFSTreeContainer = resolve_1.NodeFSTreeContainer;
// eslint-disable-next-line @typescript-eslint/no-var-requires
exports.debug = require('debug')('jayree:manifest:git:diff');
// eslint-disable-next-line import/order
const utils_1 = require("@salesforce/source-deploy-retrieve/lib/src/utils");
const registryData = tslib_1.__importStar(require("../../metadata/registry.json"));
const registry = utils_1.deepFreeze(registryData);
const registryAccess = new source_deploy_retrieve_1.RegistryAccess(registry);
async function createVirtualTreeContainer(ref, modifiedFiles) {
    exports.debug({ modifiedFiles });
    const { stdout } = await execa_1.default('git', ['ls-tree', '-r', '--name-only', ref]);
    const virtualFs = [];
    for (const path of stdout.split(os_1.EOL)) {
        let dirPath;
        let subPath = path;
        while (dirPath !== path_1.dirname(subPath)) {
            dirPath = path_1.dirname(subPath);
            const index = virtualFs.findIndex((dir) => dir.dirPath === dirPath);
            if (index >= 0) {
                virtualFs[index].children.push({
                    name: path_1.basename(subPath),
                    data: parseMetadataXml(subPath) && modifiedFiles.includes(subPath)
                        ? Buffer.from((await execa_1.default('git', ['--no-pager', 'show', `${ref}:${subPath}`])).stdout)
                        : Buffer.from(''),
                });
            }
            else {
                virtualFs.push({
                    dirPath,
                    children: [
                        {
                            name: path_1.basename(subPath),
                            data: parseMetadataXml(subPath) && modifiedFiles.includes(subPath)
                                ? Buffer.from((await execa_1.default('git', ['--no-pager', 'show', `${ref}:${subPath}`])).stdout)
                                : Buffer.from(''),
                        },
                    ],
                });
            }
            subPath = dirPath;
        }
    }
    return new source_deploy_retrieve_1.VirtualTreeContainer(virtualFs);
}
exports.createVirtualTreeContainer = createVirtualTreeContainer;
function parseMetadataXml(fsPath) {
    const match = /(.+)\.(.+)-meta\.xml/.exec(path_1.basename(fsPath));
    if (match) {
        return { fullName: match[1], suffix: match[2], path: fsPath };
    }
}
function analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    let source = '';
    let target = '';
    if (parseMetadataXml(path)) {
        try {
            const ref2resolver = new resolve_1.MetadataResolver(registryAccess, ref2VirtualTreeContainer);
            const ref2Component = ref2resolver.getComponentsFromPath(path);
            if (ref2Component.length === 1) {
                source = ref2Component[0].parseXmlSync();
            }
        }
        catch (error) {
            exports.debug({ error });
            source = '';
        }
        try {
            const ref1resolver = new resolve_1.MetadataResolver(registryAccess, ref1VirtualTreeContainer);
            const ref1Component = ref1resolver.getComponentsFromPath(path);
            if (ref1Component.length === 1) {
                target = ref1Component[0].parseXmlSync();
            }
        }
        catch (error) {
            exports.debug({ error });
            target = '';
        }
    }
    if (fast_deep_equal_1.default(target, source) && source !== '' && target !== '') {
        return { status: -1 };
    }
    else if (source === '' && target === '') {
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
        }
        catch (error) {
            return {};
        }
    })(XmlName);
    if (Object.keys(XmlTypesOfXmlName).length === 0) {
        return { status: 0 };
    }
    const PrefixOfFile = ((filePath, xmlName) => {
        let prefix = null;
        const parentObjectName = path_1.basename(filePath).split('.')[0];
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
                    // if (typeof n.obj[k] === 'object') {
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
                    //   }
                });
            }
        }
        return paths;
    };
    const targetFullNamePaths = getFullNamePaths(target);
    const sourceFullNamePaths = getFullNamePaths(source);
    const fullNamePathsNotInSource = targetFullNamePaths.filter((x) => !sourceFullNamePaths.map((f) => f.fullName).includes(x.fullName)); // deleted
    const fullNamePathsNotInTarget = sourceFullNamePaths.filter((x) => !targetFullNamePaths.map((f) => f.fullName).includes(x.fullName)); // added
    const fullNamePathsInSourceAndTarget = targetFullNamePaths.filter((x) => sourceFullNamePaths.map((f) => f.fullName).includes(x.fullName)); // modified?
    const getObjectAtPath = (diffPath, object) => {
        let current = object;
        for (const value of diffPath) {
            current = current[value];
        }
        return current;
    };
    for (const x of fullNamePathsInSourceAndTarget) {
        const y = sourceFullNamePaths.filter((f) => x.fullName === f.fullName)[0];
        if (!fast_deep_equal_1.default(getObjectAtPath(x.path, target), getObjectAtPath(y.path, source))) {
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
            var _a;
            const childXmlType = getXmlType(e, XmlTypes);
            if (childXmlType) {
                converted[childXmlType] = (_a = converted[childXmlType]) !== null && _a !== void 0 ? _a : [];
                if (PrefixOfFile) {
                    converted[childXmlType].push(`${PrefixOfFile}.${e.fullName}`);
                }
                else {
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
exports.analyzeFile = analyzeFile;
async function getGitDiff(sfdxProjectFolders, ref1ref2) {
    let gitLines = (await execa_1.default('git', ['--no-pager', 'diff', '--name-status', '--no-renames', ref1ref2])).stdout.split(/\r?\n/);
    gitLines = gitLines.filter((l) => sfdxProjectFolders.some((f) => {
        if (typeof l.split('\t')[1] !== 'undefined') {
            return l.split('\t')[1].startsWith(f);
        }
    }));
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
                    if (line.path.startsWith(path_1.join(sfdxFolder, '/main/default/').split(path_1.sep).join(path_1.posix.sep))) {
                        extf = path_1.join(sfdxFolder, '/main/default/').split(path_1.sep).join(path_1.posix.sep);
                    }
                    else {
                        extf = path_1.join(sfdxFolder, '/').split(path_1.sep).join(path_1.posix.sep);
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
exports.getGitDiff = getGitDiff;
function getGitResults(task, gitLines, ref1VirtualTreeContainer, ref2VirtualTreeContainer) {
    const results = {
        added: [],
        modified: { destructiveFiles: [], manifestFiles: [], toManifest: {}, toDestructiveChanges: {} },
        deleted: [],
        skipped: [],
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
        }
        else if (check.status > 0) {
            if (Object.keys(check.toDestructiveChanges).length) {
                results.modified.destructiveFiles.push(path);
            }
            else if (!Object.keys(check.toDestructiveChanges).length && Object.keys(check.toManifest).length) {
                results.modified.manifestFiles.push(path);
            }
            Object.keys(check).forEach((to) => {
                Object.keys(check[to]).forEach((md) => {
                    var _a, _b;
                    results.modified[to] = (_a = results.modified[to]) !== null && _a !== void 0 ? _a : {};
                    results.modified[to][md] = (_b = results.modified[to][md]) !== null && _b !== void 0 ? _b : [];
                    results.modified[to][md] = results.modified[to][md].concat(check[to][md]);
                });
            });
        }
        else if (check.status === -1) {
            results.skipped.push(path);
        }
        task.output = `${i + 1}/${gitLines.length} files processed (${results.skipped.length} skipped):
Added: ${results.added.length} Deleted: ${results.deleted.length} Modified: ${[...results.modified.destructiveFiles, ...results.modified.manifestFiles].length}`;
    }
    return results;
}
exports.getGitResults = getGitResults;
function createManifest(virtualTreeContainer, options = { destruct: false }, results, task) {
    let metadata;
    let sourcepath;
    if (options.destruct) {
        metadata = results.modified.toDestructiveChanges;
        sourcepath = results.deleted;
    }
    else {
        metadata = results.modified.toManifest;
        sourcepath = results.added;
    }
    const Aggregator = [];
    // const fromSourcePath = ComponentSet.fromSource({
    //   fsPaths: sourcepath,
    //   registry: registryAccess,
    //   tree: virtualTreeContainer,
    // });
    const fromSourcePath = new source_deploy_retrieve_1.ComponentSet();
    sourcepath.forEach((path) => {
        const resolver = new resolve_1.MetadataResolver(registryAccess, virtualTreeContainer);
        for (const component of resolver.getComponentsFromPath(path)) {
            if (['CustomFieldTranslation'].includes(component.type.name)) {
                if (!options.destruct) {
                    task.output = `'${component.type.name}:${component.fullName}' replaced with '${component.parent.type.name}:${component.parent.fullName}' in package manifest`;
                    fromSourcePath.add(component.parent);
                }
                else {
                    task.output = `'${component.type.name}:${component.fullName}' removed from destructiveChanges manifest`;
                }
            }
            else {
                fromSourcePath.add(component);
            }
        }
    });
    exports.debug({ fromSourcePath });
    Aggregator.push(...fromSourcePath);
    const replaceChildwithParentType = (type, fullName) => {
        const lower = type.toLowerCase().trim();
        if (!options.destruct &&
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
            ].includes(type)) {
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
    const filter = new source_deploy_retrieve_1.ComponentSet();
    Object.keys(metadata).forEach((type) => {
        metadata[type].forEach((fullName) => {
            exports.debug({ type, fullName });
            filter.add(replaceChildwithParentType(type, fullName));
        });
    });
    const fromMetadata = source_deploy_retrieve_1.ComponentSet.fromSource({
        fsPaths: ['.'],
        registry: registryAccess,
        tree: virtualTreeContainer,
        include: filter,
    });
    exports.debug({ fromMetadata, filter, options });
    const finalized = fromMetadata.size > 0 ? fromMetadata : filter;
    Aggregator.push(...finalized);
    const pkg = new source_deploy_retrieve_1.ComponentSet(Aggregator, registryAccess);
    return pkg;
}
exports.createManifest = createManifest;
//# sourceMappingURL=gitdiff.js.map