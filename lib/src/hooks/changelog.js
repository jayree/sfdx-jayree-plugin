"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const marked = require("marked");
const terminalRenderer = require("marked-terminal");
const path_1 = require("path");
// tslint:disable-next-line: no-any
exports.changelog = async function () {
    marked.setOptions({ renderer: new terminalRenderer() });
    const cacheDir = path_1.join(this.config.cacheDir, 'sfdx-jayree');
    fs_extra_1.ensureDirSync(cacheDir);
    const versionFile = path_1.join(cacheDir, 'version');
    const moduleRootPath = path_1.join(__dirname, '/..', '/..', '/..');
    try {
        const changelogFile = fs_1.readFileSync(path_1.join(moduleRootPath, 'CHANGELOG.md'), 'utf8');
        const packageJson = JSON.parse(fs_1.readFileSync(path_1.join(moduleRootPath, 'package.json'), 'utf8'));
        let changelogText;
        try {
            const latestVersion = JSON.parse(fs_1.readFileSync(versionFile, 'utf8'));
            changelogText = changelogFile.substring(0, changelogFile.indexOf(`[${latestVersion.version}]`));
            if (changelogText.length === 0) {
                throw new Error(`version not found`);
            }
        }
        catch (err) {
            changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
        }
        finally {
            changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
            if (changelogText.length > 0) {
                console.log(marked('# CHANGELOG (sfdx-jayree)'));
                console.log(marked(changelogText));
            }
            fs_1.writeFileSync(versionFile, JSON.stringify({ version: packageJson.version }), 'utf8');
        }
    }
    catch (error) {
        console.log('CHANGELOG.md not found');
    }
};
//# sourceMappingURL=changelog.js.map