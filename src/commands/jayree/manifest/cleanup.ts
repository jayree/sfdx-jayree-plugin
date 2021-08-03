/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import { cleanupManifestFile } from '../../../utils/manifest';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'manifestcleanup');

export default class CleanupManifest extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ]; */

  protected static flagsConfig = {
    manifest: flags.filepath({
      char: 'x',
      description: messages.getMessage('manifestFlagDescription'),
    }),
    file: flags.filepath({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
    }),
  };

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    if (!(await fs.pathExists(this.flags.file))) {
      await fs.ensureFile(this.flags.file);
      await fs.writeFile(
        this.flags.file,
        `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <types>
    <name>Audience</name>
    <!--Remove all members/the entire type-->
    <members>*</members>
  </types>
  <types>
    <name>SharingRules</name>
    <!--Remove specified members from type E.g. VideoCall-->
    <members>VideoCall</members>
  </types>
  <types>
    <name>Report</name>
    <!--Remove all members from type, but keep members: MyFolder, MyFolder/MyReport. E.g. if you don't need all your reports in your repository-->
    <members>*</members>
    <members>MyFolder</members>
    <members>MyFolder/MyReport</members>
  </types>
  <types>
    <name>CustomObject</name>
    <!--Add members. E.g. if you have used 'excludemanaged' with 'jayree:manifest:generate' to re-add required managed components-->
    <members>!ObjectName1</members>
    <members>!ObjectName2</members>
  </types>
  <version>52.0</version>
</Package>
`
      );
      this.ux.log(`Cleanup manifest file template '${this.flags.file}' was created`);
    } else {
      await cleanupManifestFile(this.flags.manifest, this.flags.file);
    }
    return {};
  }
}
