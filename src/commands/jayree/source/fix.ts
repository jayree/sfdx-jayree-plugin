/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { applyFixes, logFixes, aggregatedFixResults } from '../../../utils/souceUtils';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');

export default class FixMetadata extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ]; */

  protected static flagsConfig = {
    tag: flags.array({
      char: 't',
      description: messages.getMessage('tag'),
    }),
    verbose: flags.builtin({
      description: messages.getMessage('log'),
      longDescription: messages.getMessage('log'),
    }),
  };

  protected static supportsUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    let updatedfiles: aggregatedFixResults = {};

    try {
      updatedfiles = await applyFixes(this.flags.tag);
      // eslint-disable-next-line no-empty
    } finally {
    }

    await logFixes(updatedfiles);

    return {
      fixedFiles: Object.values(updatedfiles)
        .filter((value) => value.length > 0)
        .reduce((acc, val) => acc.concat(val), []),
      details: updatedfiles,
    };
  }
}
