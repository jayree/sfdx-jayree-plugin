"use strict";
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitResults = exports.analyzeFile = exports.appendToManifest = exports.convertTempProject = exports.addFilesToTempProject = exports.prepareTempProject = exports.ensureDirsInTempProject = exports.debug = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const util = tslib_1.__importStar(require("util"));
const fs = tslib_1.__importStar(require("fs-extra"));
const execa_1 = tslib_1.__importDefault(require("execa"));
const fast_deep_equal_1 = tslib_1.__importDefault(require("fast-deep-equal"));
const xml2js = tslib_1.__importStar(require("xml2js"));
const describe = tslib_1.__importStar(require("../../metadata/describe.json"));
const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    xmlns: true,
    renderOpts: { pretty: true, indent: '  ', newline: '\n' },
});
const parseString = util.promisify(xml2js.parseString);
// eslint-disable-next-line @typescript-eslint/no-var-requires
exports.debug = require('debug')('jayree:manifest:git:diff');
async function ensureDirsInTempProject(basePath, ctx) {
    for (const folder of ctx.sfdxProjectFolders) {
        await fs.ensureDir(path_1.join(basePath, folder));
    }
}
exports.ensureDirsInTempProject = ensureDirsInTempProject;
async function prepareTempProject(type, ctx) {
    const tmpProjectPath = path_1.join(ctx.tmpbasepath, type);
    await fs.ensureDir(ctx.tmpbasepath);
    await fs.copy(path_1.join(ctx.projectRoot, 'sfdx-project.json'), path_1.join(tmpProjectPath, 'sfdx-project.json'));
    await fs.copy(path_1.join(ctx.projectRoot, '.forceignore'), path_1.join(tmpProjectPath, '.forceignore'));
    await ensureDirsInTempProject(tmpProjectPath, ctx);
    return tmpProjectPath;
}
exports.prepareTempProject = prepareTempProject;
async function addFilesToTempProject(tmpRoot, paths, task, ctx) {
    const addedFiles = [];
    for (const path of paths) {
        const file = path_1.join(tmpRoot, path);
        task.output = path;
        await fs.ensureDir(path_1.join(tmpRoot, path_1.dirname(path)));
        const content = (async () => {
            try {
                return (await execa_1.default('git', ['--no-pager', 'show', `${ctx.git.ref2}:${path}`])).stdout;
            }
            catch (error) {
                return (await execa_1.default('git', ['--no-pager', 'show', `${ctx.git.ref1}:${path}`])).stdout;
            }
        })();
        await fs.writeFile(file, await content);
        addedFiles.push(file);
    }
    return addedFiles;
}
exports.addFilesToTempProject = addFilesToTempProject;
// eslint-disable-next-line complexity
async function convertTempProject(convertpath, options = { destruct: false }, task, ctx) {
    var _a, _b;
    let result;
    do {
        try {
            result = await execa_1.default('sfdx', ['force:source:convert', '--sourcepath', ctx.sfdxProjectFolders.toString(), '--json'], {
                cwd: convertpath,
            });
        }
        catch (e) {
            result = e;
        }
        exports.debug({ forceSourceConvertResult: result });
        result = JSON.parse(result.stdout);
        if (result.status === 1) {
            if (result.name === 'Missing Metadata File' ||
                result.name === 'MissingContentOrMetadataFile' ||
                result.name === 'MissingComponentOrResource') {
                let path;
                if (result.name === 'Missing Metadata File') {
                    path = result.message.split("Expected metadata file with '-meta.xml' extension at path: ")[1];
                }
                if (result.name === 'MissingContentOrMetadataFile') {
                    path = result.message.split('Expected file at path: ')[1];
                }
                if (result.name === 'MissingComponentOrResource') {
                    path = result.message.split(' exists and is correct, and try again.')[0].split(path_1.sep).slice(1).join(path_1.posix.sep);
                    let componentOrResource;
                    if (path.endsWith('.resource')) {
                        componentOrResource = '.resource';
                    }
                    else if (path.endsWith('.component')) {
                        componentOrResource = '.component';
                    }
                    path = path.split(componentOrResource)[0];
                    const gitLines = (await execa_1.default('git', ['--no-pager', 'log', '--name-only', '--pretty=format:', '--', `*${path}*`])).stdout.split(/\r?\n/);
                    exports.debug({ MissingComponentOrResourceLogResult: gitLines });
                    path = Array.from(new Set(gitLines.filter(Boolean))).filter((f) => !f.endsWith(`${componentOrResource}-meta.xml`))[0];
                    exports.debug({ MissingComponentOrResourceLogResultPath: path });
                    path = path_1.join(convertpath, path);
                }
                const relpath = path_1.relative(convertpath, path).split(path_1.sep).join(path_1.posix.sep);
                exports.debug({ path, convertpath, relpath });
                if (!options.destruct) {
                    task.output = `add missing file ${relpath}`;
                    await fs.ensureDir(path_1.join(convertpath, path_1.dirname(relpath)));
                    const { stdout } = await execa_1.default('git', ['--no-pager', 'show', `${ctx.git.ref2}:${relpath}`]);
                    await fs.writeFile(path, stdout);
                }
                else {
                    const arrayOfPath = [...relpath];
                    let files = [];
                    do {
                        arrayOfPath.pop();
                        files = ctx.gitResults.deleted.filter((p) => p.startsWith(arrayOfPath.join('')));
                    } while (arrayOfPath.length > 0 && files.length === 0);
                    await fs.remove(path_1.join(convertpath, files[0]));
                    ctx.gitResults.added.push(files[0]);
                    ctx.gitResults.deleted.splice(ctx.gitResults.deleted.indexOf(files[0]), 1);
                    ctx.destructiveChangesSourceFiles.splice(ctx.destructiveChangesSourceFiles.indexOf(files[0]), 1);
                    ctx.warnings[result.name] = (_a = ctx.warnings[result.name]) !== null && _a !== void 0 ? _a : {};
                    ctx.warnings[result.name][relpath] = (_b = ctx.warnings[result.name][relpath]) !== null && _b !== void 0 ? _b : [];
                    ctx.warnings[result.name][relpath].push(files[0]);
                    task.output = `moved file ${files[0]} from destructiveChanges to manifest`;
                }
            }
            else if (result.name === 'UnexpectedFileFound') {
                const path = result.message.split('Unexpected file found in package directory: ')[1];
                const relpath = path_1.relative(convertpath, path);
                task.output = `removed file ${relpath}`;
                await fs.remove(path_1.join(convertpath, relpath));
            }
            else if (result.message === 'The package root directory is empty.') {
                result.status = 0;
                result.result = { location: convertpath };
            }
            else if (result.message.startsWith('No matching source was found within the package root directory')) {
                result.status = 0;
                result.result = { location: convertpath };
            }
            else {
                throw new Error(`No error handler for: '${result.name}' - ${result.message}`);
            }
        }
    } while (result.status === 1);
    const packagexml = path_1.join(result.result.location, 'package.xml');
    if (await fs.pathExists(packagexml)) {
        return packagexml;
    }
    return null;
}
exports.convertTempProject = convertTempProject;
async function appendToManifest(file, insert) {
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
        var _a;
        types[md] = (_a = types[md]) !== null && _a !== void 0 ? _a : [];
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
exports.appendToManifest = appendToManifest;
async function analyzeFile(path, ctx) {
    let source;
    try {
        const filecontent = (await execa_1.default('git', ['--no-pager', 'show', `${ctx.git.ref2}:${path}`])).stdout;
        source = await parseString(filecontent);
    }
    catch (error) {
        source = undefined;
    }
    let target;
    try {
        const filecontent = (await execa_1.default('git', ['--no-pager', 'show', `${ctx.git.ref1}:${path}`])).stdout;
        target = await parseString(filecontent);
    }
    catch (error) {
        target = undefined;
    }
    if (fast_deep_equal_1.default(target, source) && typeof source !== 'undefined' && typeof target !== 'undefined') {
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
            return metadata[0].childXmlNames;
        }
        return [];
    })(XmlName);
    if (XmlTypesOfXmlName.length === 0) {
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
                    if (typeof n.obj[k] === 'object') {
                        // eslint-disable-next-line @typescript-eslint/no-shadow
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
async function getGitResults(task, ctx) {
    const results = {
        added: [],
        modified: { files: [], toManifest: {}, toDestructiveChanges: {} },
        deleted: [],
        skipped: [],
    };
    let gitLines = (await execa_1.default('git', ['--no-pager', 'diff', '--name-status', '--no-renames', ctx.git.ref1ref2])).stdout.split(/\r?\n/);
    gitLines = gitLines.filter((l) => ctx.sfdxProjectFolders.some((f) => {
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
            for (const sfdxFolder of ctx.sfdxProjectFolders) {
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
        }
        else if (check.status > 0) {
            results.modified.files.push(path);
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
        task.output = `${i + 1}/${gitlinesf.length} files processed (${results.skipped.length} skipped):
Added: ${results.added.length} Deleted: ${results.deleted.length} Modified: ${results.modified.files.length}`;
    }
    return results;
}
exports.getGitResults = getGitResults;
//# sourceMappingURL=gitdiff.js.map