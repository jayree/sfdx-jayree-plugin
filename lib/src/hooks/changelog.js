"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changelog = void 0;
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs_1 = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const marked = require("marked");
const terminalRenderer = require("marked-terminal");
// eslint-disable-next-line @typescript-eslint/require-await
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
                throw new Error('version not found');
            }
        }
        catch (err) {
            changelogText = changelogFile.substring(0, changelogFile.indexOf('# [', 2));
        }
        finally {
            changelogText = changelogText.substring(0, changelogText.lastIndexOf('\n'));
            if (changelogText.length > 0) {
                // eslint-disable-next-line no-console
                console.log(marked('# CHANGELOG (sfdx-jayree)'));
                // eslint-disable-next-line no-console
                console.log(marked(changelogText));
            }
            fs_1.writeFileSync(versionFile, JSON.stringify({ version: packageJson.version }), 'utf8');
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log('CHANGELOG.md not found');
    }
};
//# sourceMappingURL=changelog.js.map