import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'usersyncstatus');
export default class UserSyncStatus extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:automation:usersyncstatus -o 'Name'
    configSetup: User assigned to active Lightning Sync configuration... Yes
    userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
    userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
    userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
    `
  ];

  protected static flagsConfig = {
    officeuser: flags.string({ char: 'o', description: messages.getMessage('UserFlagDescription'), required: true })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    await this.org.refreshAuth();
    const conn = this.org.getConnection();

    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();

    await this.login(conn, page);

    // tslint:disable-next-line:prefer-const
    let { tables, userSetup } = await this.checkUserSetup(page);

    if (userSetup === 'Yes') {
      ({ tables } = await this.checkUserReset(page, tables, 'Salesforce and Exchange email addresses linked'));
      ({ tables } = await this.checkContactsEvents(page, tables, 'Salesforce and Exchange email addresses linked', ['Linked']));
      ({ tables } = await this.checkContactsEvents(page, tables, 'Salesforce to Exchange sync status', ['Initial sync completed', 'In sync']));
      ({ tables } = await this.checkContactsEvents(page, tables, 'Exchange to Salesforce sync status', ['Initial sync completed', 'In sync']));
    }
    await browser.close();

    return { description: 'text' };

  }

  private async checkUserSetup(page: puppeteer.Page) {
    await page.goto('https://eu12.salesforce.com/s2x/resetExchangeSyncUser.apexp', {
      waitUntil: 'networkidle2'
    });
    await page.focus('#resetExchangeSyncUser');
    await page.keyboard.type(this.flags.officeuser);
    this.ux.startSpinner('configSetup: User assigned to active Lightning Sync configuration');
    const tables = await this.checkstatus(page);
    const configSetupItem = tables[this.flags.officeuser].configSetup['User assigned to active Lightning Sync configuration'];
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
    if (!finalstate.includes(userContactsItem) || !finalstate.includes(userEventsItem)) {
      do {
        tables = await this.checkstatus(page);
        userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
        userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
        if (status !== userContactsItem + '/' + userEventsItem) {
          status = userContactsItem + '/' + userEventsItem;
          this.ux.setSpinnerStatus(status);
        }
      } while (!finalstate.includes(userContactsItem) || !finalstate.includes(userEventsItem));
    }
    this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);
    return { tables, userContactsItem, userEventsItem };
  }

  private async login(conn, page) {
    await page.goto('https://eu12.salesforce.com/secur/frontdoor.jsp?sid=' + conn.accessToken, {
      waitUntil: 'networkidle2'
    });
  }
  private async resetuser(page) {
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

  private async checkstatus(page) {
    await page.evaluate(() => {
      document.getElementById('thePage:theForm:thePageBlock:pageBlock:checkStatusButton').click();
    });
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
    return await page.evaluate(() => {
      const user = (document.getElementById('resetExchangeSyncUser') as HTMLInputElement).value;
      const convertedtables = {};
      ['configSetup', 'userContacts', 'userEvents'].forEach(tableid => {
        const object = {};
        if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
          // tslint:disable-next-line:no-any
          for (const row of (document.getElementById(tableid) as any).rows) {
            if (typeof row.cells[1] !== 'undefined') {
              if (typeof row.cells[1].getElementsByTagName('img')[0] !== 'undefined') {
                object[row.cells[0].innerText.replace(/(:\t)/g, '')] = row.cells[1].getElementsByTagName('img')[0].alt;
              } else {
                object[row.cells[0].innerText.replace(/(:\t)/g, '')] = row.cells[1].innerHTML;
              }
            }
          }
        }
        convertedtables[tableid] = object;
      });
      return {
        [user]: convertedtables
      };
    });
  }

}
