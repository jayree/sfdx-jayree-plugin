/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import opn from 'open';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'openorg');

export default class OrgOpen extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:org:open
$ sfdx jayree:org:open -u me@my.org
$ sfdx jayree:org:open -u MyTestOrg1 -b firefox
$ sfdx jayree:org:open -r -p lightning -b safari
$ sfdx jayree:org:open -u me@my.org`,
  ];

  protected static flagsConfig = {
    browser: flags.string({
      char: 'b',
      description: messages.getMessage('browserFlagDescription'),
      options: ['firefox', 'chrome', 'edge', 'safari'],
      default: 'chrome',
    }),
    path: flags.string({
      char: 'p',
      description: messages.getMessage('pathFlagDescription'),
    }),
    urlonly: flags.boolean({
      char: 'r',
      description: messages.getMessage('urlonlyFlagDescription'),
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    let browser;

    switch (this.flags.browser) {
      case 'chrome':
        browser = opn.apps.chrome;
        break;
      case 'firefox':
        browser = opn.apps.firefox;
        break;
      case 'edge':
        browser = opn.apps.edge;
        break;
      case 'safari':
        if (process.platform === 'darwin') {
          browser = 'safari';
          break;
        }
        throw Error(this.flags.browser + ' is not supported on ' + process.platform);
    }

    const conn = this.org.getConnection();
    let url = conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken;

    if (this.flags.path) {
      url = url + '&retURL=' + this.flags.path;
    }

    this.ux.log(
      'Access org ' +
        this.org.getOrgId() +
        ' as user ' +
        this.org.getUsername() +
        ' with the following URL: ' +
        url +
        " using browser '" +
        browser +
        "'"
    );

    /* istanbul ignore next */
    if (!this.flags.urlonly) {
      await opn(url, {
        app: { name: browser },
        wait: false,
      });
    }

    return {
      url,
      orgId: this.org.getOrgId(),
      username: this.org.getUsername(),
    };
  }
}
