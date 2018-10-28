import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'getpackagedescription');
export default class UserSyncStatus extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:packagedescription:get --file FILENAME
    Description of Package FILENAME
    `
  ];

  protected static flagsConfig = {
    officeuser: flags.string({ char: 'o', description: messages.getMessage('fileFlagDescription'), required: true })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    // const inputfile = this.args.file || this.flags.file;
    const conn = this.org.getConnection();

    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await this.login(conn, page);

    await page.goto('https://eu12.salesforce.com/s2x/resetExchangeSyncUser.apexp', {
      waitUntil: 'networkidle2'
    });

    await page.focus('#resetExchangeSyncUser');
    await page.keyboard.type(this.flags.officeuser);

    let tables = {};
    let status = '';

    this.ux.startSpinner('configSetup: User assigned to active Lightning Sync configuration');
    tables = await this.checkstatus(page);

    let configSetupItem = tables[this.flags.officeuser].configSetup['User assigned to active Lightning Sync configuration'];

    this.ux.stopSpinner(configSetupItem);

    if (configSetupItem === 'Yes') {
      let itemtext = 'Salesforce and Exchange email addresses linked';
      let userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
      let userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
      this.ux.startSpinner('userContacts/userEvents: ' + itemtext);
      if (!['Linked'].includes(userContactsItem) || !['Linked'].includes(userEventsItem)) {

        this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);
        this.ux.log('User needs a sync reset!');
        await this.resetuser(page);
        itemtext = 'Reset sync status';
        configSetupItem = tables[this.flags.officeuser].configSetup[itemtext];
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

        itemtext = 'Salesforce and Exchange email addresses linked';
        userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
        userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
        this.ux.startSpinner('userContacts/userEvents: ' + itemtext);
        if (!['Linked'].includes(userContactsItem) || !['Linked'].includes(userEventsItem)) {
          do {
            tables = await this.checkstatus(page);
            userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
            userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
            if (status !== userContactsItem + '/' + userEventsItem) {
              status = userContactsItem + '/' + userEventsItem;
              this.ux.setSpinnerStatus(status);
            }
          } while (!['Linked'].includes(userContactsItem) || !['Linked'].includes(userEventsItem));
        }
        this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);

      } else {
        this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);
      }

      itemtext = 'Salesforce to Exchange sync status';
      userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
      userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
      this.ux.startSpinner('userContacts/userEvents: ' + itemtext);
      if (!['Initial sync completed', 'In sync'].includes(userContactsItem) || !['Initial sync completed', 'In sync'].includes(userEventsItem)) {
        do {
          tables = await this.checkstatus(page);
          userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
          userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
          if (status !== userContactsItem + '/' + userEventsItem) {
            status = userContactsItem + '/' + userEventsItem;
            this.ux.setSpinnerStatus(status);
          }
        } while (!['Initial sync completed', 'In sync'].includes(userContactsItem) || !['Initial sync completed', 'In sync'].includes(userEventsItem));
      }
      this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);

      itemtext = 'Exchange to Salesforce sync status';
      userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
      userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
      this.ux.startSpinner('userContacts/userEvents: ' + itemtext);
      if (!['Initial sync completed', 'In sync'].includes(userContactsItem) || !['Initial sync completed', 'In sync'].includes(userEventsItem)) {
        do {
          tables = await this.checkstatus(page);
          userContactsItem = tables[this.flags.officeuser].userContacts[itemtext];
          userEventsItem = tables[this.flags.officeuser].userEvents[itemtext];
          if (status !== userContactsItem + '/' + userEventsItem) {
            status = userContactsItem + '/' + userEventsItem;
            this.ux.setSpinnerStatus(status);
          }
        } while (!['Initial sync completed', 'In sync'].includes(userContactsItem) || !['Initial sync completed', 'In sync'].includes(userEventsItem));
      }
      this.ux.stopSpinner(userContactsItem + '/' + userEventsItem);

    }
    browser.close();

    return { description: 'text' };

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
