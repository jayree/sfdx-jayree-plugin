"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const marked = require("marked");
const terminalRenderer = require("marked-terminal");
const path_1 = require("path");
// tslint:disable-next-line: no-any
exports.changelog = async () => {
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
    const latestversionfile = path_1.join(moduleRootPath, '.latestversion.json');
    const changelogfile = fs_1.readFileSync(path_1.join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
    const packagejson = require(path_1.join(moduleRootPath, 'package.json'));
    let changelogtext;
    try {
        const latestversion = require(latestversionfile);
        changelogtext = changelogfile.substring(0, changelogfile.indexOf(`[${latestversion.version}]`));
    }
    catch (err) {
        changelogtext = changelogfile.substring(0, changelogfile.indexOf('# [', 2));
    }
    finally {
        changelogtext = changelogtext.substring(0, changelogtext.lastIndexOf('\n'));
        if (changelogtext.length > 0) {
            console.log(marked('# CHANGELOG (sfdx-jayree) - ' + moduleRootPath));
            console.log(marked(changelogtext));
        }
        fs_1.writeFileSync(latestversionfile, JSON.stringify({ version: packagejson.version }), 'utf8');
    }
};
//# sourceMappingURL=changelog.js.map