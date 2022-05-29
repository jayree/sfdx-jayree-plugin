"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentStateFolderFilePath = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const ignore_1 = __importDefault(require("ignore"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:state:folder');
async function getCurrentStateFolderFilePath(projectPath, file, migrate) {
    const sfdxPath = path.join(projectPath, '.sfdx', file);
    const sfPath = path.join(projectPath, '.sf', file);
    if (!(await fs.pathExists(sfPath))) {
        if (await fs.pathExists(path.join(projectPath, '.gitignore'))) {
            const gitIgnore = (0, ignore_1.default)().add(Buffer.from(await fs.readFile(path.join(projectPath, '.gitignore'))).toString());
            if (!gitIgnore.ignores(path.join('.sf', file))) {
                if (gitIgnore.ignores(path.join('.sfdx', file))) {
                    debug('use sfdx state folder');
                    return sfdxPath;
                }
            }
        }
        if (await fs.pathExists(sfdxPath)) {
            if (migrate) {
                debug(`migrate '${file}' to '.sf' state folder`);
                await fs.copy(sfdxPath, sfPath);
            }
            else {
                debug('use sfdx state folder');
                return sfdxPath;
            }
        }
    }
    debug('use sf state folder');
    return sfPath;
}
exports.getCurrentStateFolderFilePath = getCurrentStateFolderFilePath;
//# sourceMappingURL=stateFolderHandler.js.map