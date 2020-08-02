"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fs_1 = require("fs");
const path_1 = require("path");
const command_1 = require("@salesforce/command");
class Version extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const root = () => {
            let currentPath = __dirname;
            let rootpath;
            while (!rootpath) {
                try {
                    fs_1.accessSync(path_1.join(currentPath, 'package.json'));
                    rootpath = currentPath;
                }
                catch (_a) {
                    currentPath = path_1.dirname(currentPath);
                }
            }
            return rootpath;
        };
        const packageJsonData = JSON.parse(fs_1.readFileSync(path_1.join(root(), 'package.json'), 'utf-8'));
        this.ux.log(packageJsonData.version);
        return {
            version: packageJsonData.version,
        };
    }
}
exports.default = Version;
Version.hidden = true;
//# sourceMappingURL=version.js.map