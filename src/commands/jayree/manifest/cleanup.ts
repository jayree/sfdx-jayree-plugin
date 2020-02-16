import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { cleanupManifestFile } from '../../../lib/manifest';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'manifestcleanup');

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
      description: messages.getMessage('manifestFlagDescription')
    }),
    file: flags.filepath({
      char: 'f',
      description: messages.getMessage('fileFlagDescription')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    await cleanupManifestFile(this.flags.manifest, this.flags.file);
    return {};
  }
}
