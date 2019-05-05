import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');
import serializeError = require('serialize-error');

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'ltngsyncstatus');
export default class LtngSyncStatus extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:automation:ltngsync:status -o 'Name'
    configSetup: User assigned to active Lightning Sync configuration... Yes
    userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
    userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
    userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
    `
  ];

  protected static flagsConfig = {
    officeuser: flags.string({
      char: 'o',
      description: messages.getMessage('UserFlagDescription'),
      required: true
    }),
    statusonly: flags.boolean({
      char: 's',
      description: messages.getMessage('StatusFlagDescription'),
      required: false
    }),
    wait: flags.integer({
      char: 'w',
      description: messages.getMessage('waitFlagDescription'),
      required: false
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const browser = await puppeteer.launch({
      headless: true
    });
    let tables;

    try {
      const conn = this.org.getConnection();

      const page = await browser.newPage();

      await this.login(conn, page);

      await page.goto(conn.instanceUrl + '/s2x/resetExchangeSyncUser.apexp', {
        waitUntil: 'networkidle2'
      });

      tables = await this.gettables(page);

      if (
        (!(tables.System['orgConfigInfo']['Connection method configured'] === 'No') ||
          tables.System['orgConfigInfo']['Outlook Integration enabled'] === 'Yes') &&
        this.flags.officeuser
      ) {
        let userSetup;
        ({ tables, userSetup } = await this.checkUserSetup(page));

        if (userSetup === 'Yes' && !this.flags.statusonly) {
          ({ tables } = await this.checkUserReset(page, tables, 'Salesforce and Exchange email addresses linked'));
          ({ tables } = await this.checkContactsEvents(page, tables, 'Salesforce and Exchange email addresses linked', [
            'Linked'
          ]));
          ({ tables } = await this.checkContactsEvents(page, tables, 'Salesforce to Exchange sync status', [
            'Initial sync completed',
            'In sync'
          ]));
          ({ tables } = await this.checkContactsEvents(page, tables, 'Exchange to Salesforce sync status', [
            'Initial sync completed',
            'In sync'
          ]));
        }
      } else {
        this.flags.statusonly = true;
      }

      if (this.flags.statusonly) {
        this.flags.officeuser ? this.ux.styledJSON(tables[this.flags.officeuser]) : this.ux.styledJSON(tables);
      }
    } catch (error) {
      this.ux.stopSpinner();
      this.logger.error({ error: serializeError(error) });
      throw error;
    } finally {
      await browser.close();
    }

    return tables;
  }

  private async checkUserSetup(page: puppeteer.Page) {
    this.ux.startSpinner('configSetup: User assigned to active Lightning Sync configuration');
    let tables = await this.checkstatus(page);
    let configSetupItem;
    if (tables.System['orgConfigInfo']['Users with linked Exchange and Salesforce email addresses'] !== '0') {
      await page.focus('#resetExchangeSyncUser');
      await page.keyboard.type(this.flags.officeuser);

      tables = await this.checkstatus(page);
      try {
        configSetupItem =
          tables[this.flags.officeuser].configSetup['User assigned to active Lightning Sync configuration'];
      } catch {
        tables[this.flags.officeuser] = {
          configSetup: {
            'User assigned to active Lightning Sync configuration': 'No'
          }
        };
        configSetupItem = 'No';
      }
    } else {
      this.ux.stopSpinner();
      throw Error('Users with linked Exchange and Salesforce email addresses: 0');
    }
    this.ux.stopSpinner(configSetupItem);
    return { tables, userSetup: configSetupItem };
  }

  private async checkUserReset(page: puppeteer.Page, tables: {}, itemtext: string) {
    const userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
    const userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
    let status = '';
    if (!['Linked'].includes(userContactsItem) || !['Linked'].includes(userEventsItem)) {
      this.ux.log('userContacts/userEvents: ' + itemtext + '... ' + userContactsItem + '/' + userEventsItem);
      if (await this.ux.confirm('Do you want to perform a sync reset? (yes/no)')) {
        await this.resetuser(page);
        itemtext = 'Reset sync status';
        let configSetupItem = tables[this.flags.officeuser].configSetup[itemtext];
        this.ux.startSpinner('configSetup: ' + itemtext);
        do {
          tables = await this.checkstatus(page);
          configSetupItem = tables[this.flags.officeuser].configSetup[itemtext];
          if (status !== configSetupItem && typeof configSetupItem !== 'undefined') {
            status = configSetupItem;
            this.ux.setSpinnerStatus(status);
          }
        } while (typeof configSetupItem !== 'undefined');
        this.ux.stopSpinner('Reset completed');
      }
    }
    return { tables };
  }

  private async checkContactsEvents(page: puppeteer.Page, tables: {}, itemtext: string, finalstate: string[]) {
    let userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
    let userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
    let status = '';
    this.ux.startSpinner('userContacts/userEvents: ' + itemtext);
    const end = Date.now() + this.flags.wait * 1000 * 60;
    if (!finalstate.includes(userContactsItem) || !finalstate.includes(userEventsItem)) {
      do {
        tables = await this.checkstatus(page);
        userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
        userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
        if (status !== userContactsItem + '/' + userEventsItem) {
          status = userContactsItem + '/' + userEventsItem;
          this.ux.setSpinnerStatus(status);
        }
      } while (
        (!finalstate.includes(userContactsItem) || !finalstate.includes(userEventsItem)) &&
        !(Date.now() > end && typeof this.flags.wait !== 'undefined')
      );
    }
    if (Date.now() > end && typeof this.flags.wait !== 'undefined') {
      this.ux.stopSpinner('timeout!');
    } else {
      this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);
    }
    return { tables, userContactsItem, userEventsItem };
  }

  private async login(conn: core.Connection, page: puppeteer.Page) {
    await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
      waitUntil: 'networkidle2'
    });
  }
  private async resetuser(page: puppeteer.Page) {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.evaluate(() => {
      document.getElementById('thePage:theForm:thePageBlock:pageBlock:resetButton').click();
    });
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
  }

  private async gettables(page: puppeteer.Page) {
    return await page.evaluate(() => {
      const converttables = (document: Document, tables: string[]) => {
        const convertedtables = {};
        tables.forEach(tableid => {
          const object = {};
          if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
            // tslint:disable-next-line:no-any
            for (const row of (document.getElementById(tableid) as any).rows) {
              if (typeof row.cells[1] !== 'undefined') {
                if (typeof row.cells[1].getElementsByTagName('img')[0] !== 'undefined') {
                  object[row.cells[0].innerText.replace(/(:|:\t|\t)/g, '')] = row.cells[1].getElementsByTagName(
                    'img'
                  )[0].alt;
                } else {
                  object[row.cells[0].innerText.replace(/(:|:\t|\t)/g, '')] = row.cells[1].innerText;
                }
              }
            }
          }
          convertedtables[tableid] = object;
        });
        return convertedtables;
      };

      const returntables = {
        System: converttables(document, ['orgConfigInfo', 'orgContacts', 'orgEvents'])
      };
      if (
        typeof document.getElementById('resetExchangeSyncUser') !== 'undefined' &&
        document.getElementById('resetExchangeSyncUser')
      ) {
        const user = (document.getElementById('resetExchangeSyncUser') as HTMLInputElement).value;
        if (user !== '') {
          returntables[user] = converttables(document, ['configSetup', 'userContacts', 'userEvents']);
        }
      }
      return returntables;
    });
  }

  private async checkstatus(page: puppeteer.Page) {
    await page.evaluate(() => {
      document.getElementById('thePage:theForm:thePageBlock:pageBlock:checkStatusButton').click();
    });
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
    return this.gettables(page);
  }
}
