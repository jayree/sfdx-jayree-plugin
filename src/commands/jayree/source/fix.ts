import { core, flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as path from 'path';
import { SourceRetrieveBase } from '../../../sourceRetrieveBase';

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
      description: messages.getMessage('tag')
    }),
    verbose: flags.builtin({
      description: messages.getMessage('log'),
      longDescription: messages.getMessage('log')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    const projectpath = this.project.getPath();

    try {
      const configfile = '.sfdx-jayree.json';
      let config;
      try {
        config = require(path.join(projectpath, configfile));
      } catch (error) {
        // this.ux.warn(`Config file '${configfile}' not found - SKIPPING metadata fixes`);
      }

      if (config) {
        for (const tag of this.flags.tag) {
          if (config[tag]) {
            const c = config[tag];
            for (const workarounds of Object.keys(c)) {
              for (const workaround of Object.keys(c[workarounds])) {
                if (c[workarounds][workaround].isactive === true) {
                  if (c[workarounds][workaround].files) {
                    this.log("'" + workaround + "'");
                    if (c[workarounds][workaround].files.delete) {
                      await this.sourcedelete(c[workarounds][workaround].files.delete, projectpath);
                    }
                    if (c[workarounds][workaround].files.modify) {
                      await this.sourcefix(
                        c[workarounds][workaround].files.modify,
                        projectpath,
                        this.org.getConnection()
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw error;
    } finally {
    }

    return {};
  }
}
