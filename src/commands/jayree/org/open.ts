import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import opn = require('opn');

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'openorg');

export default class OrgOpen extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:org:open
$ sfdx jayree:org:open -u me@my.org
$ sfdx jayree:org:open -u MyTestOrg1 -b firefox
$ sfdx jayree:org:open -r -p lightning -b safari
$ sfdx jayree:org:open -u me@my.org`
  ];

  protected static flagsConfig = {
    browser: flags.string({
      char: 'b',
      description: messages.getMessage('browserFlagDescription'),
      options: ['firefox', 'chrome', 'safari'],
      default: 'chrome'
    }),
    path: flags.string({
      char: 'p',
      description: messages.getMessage('pathFlagDescription')
    }),
    urlonly: flags.boolean({
      char: 'r',
      description: messages.getMessage('urlonlyFlagDescription')
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    let browser = '';
    switch (process.platform) {
      case 'win32':
        switch (this.flags.browser) {
          case 'chrome':
            browser = 'chrome';
            break;
          case 'firefox':
            browser = 'firefox';
            break;
          case 'safari':
            throw Error(this.flags.browser + ' is not supported on ' + process.platform);
        }
        break;
      case 'darwin':
        switch (this.flags.browser) {
          case 'chrome':
            browser = 'google chrome';
            break;
          case 'firefox':
            browser = 'firefox';
            break;
          case 'safari':
            browser = 'safari';
            break;
        }
        break;
      case 'linux':
        switch (this.flags.browser) {
          case 'chrome':
            browser = 'google-chrome';
            break;
          case 'firefox':
            browser = 'firefox';
            break;
          case 'safari':
            throw Error(this.flags.browser + ' is not supported on ' + process.platform);
        }
        break;
      default:
        throw Error('OS ' + process.platform + ' is not supported yet.');
    }

    await this.org.refreshAuth();
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
      opn(url, {
        app: browser,
        wait: false
      });
    }

    return {
      url,
      orgId: this.org.getOrgId(),
      username: this.org.getUsername()
    };
  }
}
