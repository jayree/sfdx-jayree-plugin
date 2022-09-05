/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
import { join } from 'path';
import fs from 'fs-extra';
import Debug from 'debug';
import TerminalRenderer from 'marked-terminal';
import { marked } from 'marked';
import semver from 'semver';
import { Hook } from '@oclif/core';

const debug = Debug('jayree:hooks');

// original from https://github.com/salesforcecli/plugin-info/blob/main/src/shared/parseReleaseNotes.ts
const parseReleaseNotes = (notes: string, version: string): marked.Token[] => {
  let found = false;
  let closestVersion: string;
  let versions: string[];

  const parsed = marked.lexer(notes);

  let tokens: marked.Token[];

  const findVersion = (desiredVersion: string): void => {
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
      } else if (found === true) {
        return token;
      }
    });
  };

  findVersion(version);

  if (!tokens.length) {
    // If version was not found, try again with the closest patch version
    const semverRange = `${semver.major(version)}.${semver.minor(version)}.x`;

    closestVersion = semver.maxSatisfying<string>(versions, semverRange);

    findVersion(closestVersion);
  }

  if (closestVersion !== undefined) {
    const warning = marked.lexer(
      `# ATTENTION: Version ${version} was not found. Showing notes for closest patch version ${closestVersion}.`
    )[0];

    tokens.unshift(warning);
  }

  return tokens;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const changelog: Hook<'changelog'> = async function () {
  process.once('exit', () => {
    try {
      const pluginRootPath = join(new URL('./', import.meta.url).pathname, '..', '..');
      const { name, version } = fs.readJsonSync(join(pluginRootPath, 'package.json')) as {
        name: string;
        version: string;
      };
      const changelogFile = fs.readFileSync(join(pluginRootPath, 'CHANGELOG.md'), 'utf8');
      const cacheDir = join(this.config.cacheDir, name);
      const versionFile = join(cacheDir, 'version');
      fs.ensureFileSync(versionFile);
      let latestVersion: { version: string };
      try {
        latestVersion = fs.readJSONSync(versionFile) as { version: string };
      } catch (error) {
        latestVersion = { version: '0.0.0' };
      }
      debug({ latestVersion: latestVersion.version, version });
      if (latestVersion.version !== version) {
        const tokens = parseReleaseNotes(changelogFile, version);
        if (!tokens.length) {
          debug(`${name} - didn't find version '${version}'.`);
        } else {
          marked.setOptions({
            renderer: new TerminalRenderer({ emoji: false }),
          });
          tokens.unshift(marked.lexer(`# Changelog for '${name}':`)[0]);
          this.log(marked.parser(tokens));
          fs.writeJsonSync(versionFile, { version });
        }
      } else {
        debug(`${name} - no update`);
      }
    } catch (error) {
      debug(error);
    }
  });
};
