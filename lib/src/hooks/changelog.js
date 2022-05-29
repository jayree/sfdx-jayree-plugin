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
Object.defineProperty(exports, "__esModule", { value: true });
exports.changelog = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const path_1 = require("path");
const fs = __importStar(require("fs-extra"));
const debug_1 = require("debug");
const TerminalRenderer = require("marked-terminal");
const marked_1 = require("marked");
const semver = __importStar(require("semver"));
const core_1 = require("@oclif/core");
const debug = (0, debug_1.debug)('jayree:hooks');
// original from https://github.com/salesforcecli/plugin-info/blob/main/src/shared/parseReleaseNotes.ts
const parseReleaseNotes = (notes, version) => {
    let found = false;
    let closestVersion;
    let versions;
    const parsed = marked_1.marked.lexer(notes);
    let tokens;
    const findVersion = (desiredVersion) => {
        versions = [];
        tokens = parsed.filter((token) => {
            // TODO: Could make header depth (2) a setting in oclif.info.releasenotes
            if (token.type === 'heading' && token.depth <= 2) {
                const coercedVersion = semver.coerce(token.text).version;
                // We will use this to find the closest patch if passed version is not found
                versions.push(coercedVersion);
                if (coercedVersion === desiredVersion) {
                    found = true;
                    return token;
                }
                found = false;
            }
            else if (found === true) {
                return token;
            }
        });
    };
    findVersion(version);
    if (!tokens.length) {
        // If version was not found, try again with the closest patch version
        const semverRange = `${semver.major(version)}.${semver.minor(version)}.x`;
        closestVersion = semver.maxSatisfying(versions, semverRange);
        findVersion(closestVersion);
    }
    if (closestVersion !== undefined) {
        const warning = marked_1.marked.lexer(`# ATTENTION: Version ${version} was not found. Showing notes for closest patch version ${closestVersion}.`)[0];
        tokens.unshift(warning);
    }
    return tokens;
};
// eslint-disable-next-line @typescript-eslint/require-await
const changelog = async function () {
    process.once('exit', () => {
        try {
            const pluginRootPath = (0, path_1.join)(__dirname, '..', '..', '..');
            const { name, version } = fs.readJsonSync((0, path_1.join)(pluginRootPath, 'package.json'));
            const changelogFile = fs.readFileSync((0, path_1.join)(pluginRootPath, 'CHANGELOG.md'), 'utf8');
            const cacheDir = (0, path_1.join)(this.config.cacheDir, name);
            const versionFile = (0, path_1.join)(cacheDir, 'version');
            fs.ensureFileSync(versionFile);
            let latestVersion;
            try {
                latestVersion = fs.readJSONSync(versionFile);
            }
            catch (error) {
                latestVersion = { version: '0.0.0' };
            }
            debug({ latestVersion: latestVersion.version, version });
            if (latestVersion.version !== version) {
                const tokens = parseReleaseNotes(changelogFile, version);
                if (!tokens.length) {
                    debug(`${name} - didn't find version '${version}'.`);
                }
                else {
                    marked_1.marked.setOptions({
                        renderer: new TerminalRenderer({ emoji: false }),
                    });
                    tokens.unshift(marked_1.marked.lexer(`# Changelog for '${name}':`)[0]);
                    core_1.CliUx.ux.log(marked_1.marked.parser(tokens));
                    fs.writeJsonSync(versionFile, { version });
                }
            }
            else {
                debug(`${name} - no update`);
            }
        }
        catch (error) {
            debug(error);
        }
    });
};
exports.changelog = changelog;
//# sourceMappingURL=changelog.js.map