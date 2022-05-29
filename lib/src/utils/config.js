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
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path_1 = require("path");
const fs = __importStar(require("fs-extra"));
const is_docker_1 = __importDefault(require("is-docker"));
const is_wsl_1 = __importDefault(require("is-wsl"));
const core_1 = require("@salesforce/core");
const CONFIG_DEFAULTS = {
    ensureUserPermissions: [],
    ensureObjectPermissions: [],
    moveSourceFolders: [],
    applySourceFixes: ['source:retrieve:full', 'source:retrieve:all'],
    runHooks: false,
    puppeteerDocker: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=site-per-process'],
    },
    puppeteerWSL: {
        headless: true,
        executablePath: '/bin/google-chrome',
    },
    puppeteer: {
        headless: true,
    },
};
const resolvedConfigs = {};
exports.default = (path = core_1.SfProject.resolveProjectPathSync()) => {
    if (path && resolvedConfigs[path]) {
        return resolvedConfigs[path];
    }
    const defaults = CONFIG_DEFAULTS;
    let configFromFile;
    try {
        configFromFile = fs.readJsonSync((0, path_1.join)(path, '.sfdx-jayree.json'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            configFromFile = {};
        }
        else {
            throw error;
        }
    }
    if (configFromFile.puppeteer && (0, is_docker_1.default)()) {
        configFromFile.puppeteer = { ...defaults.puppeteerDocker, ...configFromFile.puppeteer };
    }
    if (configFromFile.puppeteer && is_wsl_1.default) {
        configFromFile.puppeteer = { ...defaults.puppeteerWSL, ...configFromFile.puppeteer };
    }
    const config = {
        ...configFromFile,
        ensureUserPermissions: configFromFile.ensureUserPermissions || defaults.ensureUserPermissions,
        ensureObjectPermissions: configFromFile.ensureObjectPermissions || defaults.ensureObjectPermissions,
        moveSourceFolders: configFromFile.moveSourceFolders || defaults.moveSourceFolders,
        applySourceFixes: configFromFile.applySourceFixes || defaults.applySourceFixes,
        runHooks: configFromFile.runHooks || defaults.runHooks,
        puppeteer: configFromFile.puppeteer ||
            (is_wsl_1.default && defaults.puppeteerWSL) ||
            ((0, is_docker_1.default)() && defaults.puppeteerDocker) ||
            defaults.puppeteer,
    };
    resolvedConfigs[path] = config;
    return config;
};
//# sourceMappingURL=config.js.map