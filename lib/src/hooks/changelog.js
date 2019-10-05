"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const marked = require("marked");
const terminalRenderer = require("marked-terminal");
const path_1 = require("path");
// tslint:disable-next-line: no-any
exports.changelog = async function () {
    let currentPath = __dirname;
    let moduleRootPath;
    while (!moduleRootPath) {
        try {
            const path = path_1.join(currentPath, 'package.json');
            fs_1.accessSync(path);
            moduleRootPath = currentPath;
        }
        catch (err) {
            currentPath = path_1.dirname(currentPath);
            if (currentPath === '/') {
                throw new Error(`package.json root not found`);
            }
        }
    }
    marked.setOptions({ renderer: new terminalRenderer() });
    const cachedir = path_1.join(this.config.cacheDir, 'sfdx-jayree');
    fs_extra_1.ensureDirSync(cachedir);
    const versionfile = path_1.join(cachedir, 'version');
    const changelogfile = fs_1.readFileSync(path_1.join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
    let changelogtext;
    const packagejson = JSON.parse(fs_1.readFileSync(path_1.join(moduleRootPath, 'package.json'), 'utf8'));
    try {
        const latestversion = JSON.parse(fs_1.readFileSync(versionfile, 'utf8'));
        changelogtext = changelogfile.substring(0, changelogfile.indexOf(`[${latestversion.version}]`));
        if (changelogtext.length === 0) {
            throw new Error(`version not found`);
        }
    }
    catch (err) {
        changelogtext = changelogfile.substring(0, changelogfile.indexOf('# [', 2));
    }
    finally {
        changelogtext = changelogtext.substring(0, changelogtext.lastIndexOf('\n'));
        if (changelogtext.length > 0) {
            console.log(marked('# CHANGELOG (sfdx-jayree)'));
            console.log(marked(changelogtext));
        }
        fs_1.writeFileSync(versionfile, JSON.stringify({ version: packagejson.version }), 'utf8');
    }
};
//# sourceMappingURL=changelog.js.map