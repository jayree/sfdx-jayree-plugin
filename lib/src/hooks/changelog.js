"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changelog = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path_1 = require("path");
const fs = (0, tslib_1.__importStar)(require("fs-extra"));
const fs_extra_1 = require("fs-extra");
const marked_1 = (0, tslib_1.__importDefault)(require("marked"));
const marked_terminal_1 = (0, tslib_1.__importDefault)(require("marked-terminal"));
// eslint-disable-next-line @typescript-eslint/require-await
const changelog = async function () {
    process.once('exit', () => {
        marked_1.default.setOptions({ renderer: new marked_terminal_1.default() });
        const cacheDir = (0, path_1.join)(this.config.cacheDir, 'sfdx-jayree');
        (0, fs_extra_1.ensureDirSync)(cacheDir);
        const versionFile = (0, path_1.join)(cacheDir, 'version');
        try {
            const moduleRootPath = (0, path_1.join)(__dirname, '..', '..', '..');
            const changelogFile = fs.readFileSync((0, path_1.join)(moduleRootPath, 'CHANGELOG.md'), 'utf8');
            const packageJson = fs.readJSONSync((0, path_1.join)(moduleRootPath, 'package.json'));
            let changelogText;
            try {
                const latestVersion = fs.readJSONSync(versionFile);
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
                    console.log((0, marked_1.default)('# CHANGELOG (sfdx-jayree)'));
                    // eslint-disable-next-line no-console
                    console.log((0, marked_1.default)(changelogText));
                }
                fs.writeJsonSync(versionFile, { version: packageJson.version });
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.log('CHANGELOG.md not found');
        }
    });
};
exports.changelog = changelog;
//# sourceMappingURL=changelog.js.map