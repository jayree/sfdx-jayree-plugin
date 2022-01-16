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
/* istanbul ignore file */
const path_1 = require("path");
const fs = (0, tslib_1.__importStar)(require("fs-extra"));
const debug_1 = require("debug");
const TerminalRenderer = require("marked-terminal");
const marked_1 = require("marked");
const semver = (0, tslib_1.__importStar)(require("semver"));
const cli_ux_1 = require("cli-ux");
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
const changelog = function () {
    process.once('exit', () => {
        try {
            const pluginRootPath = (0, path_1.join)(__dirname, '..', '..', '..');
            const { name, version } = fs.readJsonSync((0, path_1.join)(pluginRootPath, 'package.json'));
            const changelogFile = fs.readFileSync((0, path_1.join)(pluginRootPath, 'CHANGELOG.md'), 'utf8');
            const cacheDir = (0, path_1.join)(this.config.cacheDir, name);
            fs.ensureDirSync(cacheDir);
            const versionFile = (0, path_1.join)(cacheDir, 'version');
            const latestVersion = fs.readJSONSync(versionFile);
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
                    cli_ux_1.cli.log(marked_1.marked.parser(tokens));
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