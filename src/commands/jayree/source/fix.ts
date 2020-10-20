/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { SourceRetrieveBase } from '../../../sourceRetrieveBase';
import { applyFixes, aggregatedFixResults } from '../../../utils/souceUtils';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'sourceretrievefix');

export default class FixMetadata extends SourceRetrieveBase {
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

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    let updatedfiles: aggregatedFixResults = {};

    try {
      updatedfiles = await applyFixes(this.flags.tag);
      // eslint-disable-next-line no-empty
    } finally {
    }
    return {
      fixedFiles: Object.values(updatedfiles)
        .filter((value) => value.length > 0)
        .reduce((acc, val) => acc.concat(val), []),
      details: updatedfiles,
    };
  }
}
