import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  ((Symbol as any)['asyncIterator']) = Symbol.for('asyncIterator');
}

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'deploychangeset');
export default class UserSyncStatus extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
      `$ sfdx jayree:automation:usersyncstatus -o 'Name'
      configSetup: User assigned to active Lightning Sync configuration... Yes
      userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
      userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
      userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
      `
    ]; */

  protected static flagsConfig = {
    changeset: flags.string({ char: 's', description: messages.getMessage('changesetFlagDescription'), required: false })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    await this.org.refreshAuth();
    const conn = this.org.getConnection();

    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

    await this.login(conn, page);

    await page.goto(conn.instanceUrl + '/changemgmt/listInboundChangeSet.apexp', {
      waitUntil: 'networkidle2'
    });

    const tables = await this.gettables(page);

    await this.ux.styledJSON(tables.csad);

    await browser.close();

    return tables.csad;
  }

  private async login(conn: core.Connection, page: puppeteer.Page) {
    await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
      waitUntil: 'networkidle2'
    });
  }

  private async gettables(page: puppeteer.Page) {
    return await page.evaluate(() => {

      const converttable = (document: Document, tableid: string) => {
        const rows = [];
        if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
          const table = document.getElementById(tableid) as HTMLTableElement;
          for (let r = 1, n = table.rows.length; r < n; r++) {
            const cells = {};
            for (let c = 1, m = table.rows[r].cells.length; c < m; c++) {
              cells[table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '')] = table.rows[r].cells[c].innerText.replace(/(:\t|\t)/g, '');
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Change Set Name') {
                const div = document.createElement('div');
                div.innerHTML = table.rows[r].cells[c].innerHTML;
                cells['DetailPage'] = (div.firstChild as Element).getAttribute('href');
              }
            }
            rows.push(cells);
          }
        }
        return rows;
      };
      return {
        csad: converttable(document, 'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:AwaitingDeploymentPageBlock:ListUnDeployedInboundChangeSetBlockSection:UnDeployedInboundChangeSetList'),
        dcs: converttable(document, 'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:DeployedPageBlock:ListDeployedInboundChangeSetBlockSection:DeployedInboundChangeSetList')
      };
    });
  }

}
