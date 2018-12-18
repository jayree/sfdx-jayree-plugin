import { core, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'listchangeset');
export default class ViewChangeSets extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
      `$ sfdx jayree:automation:usersyncstatus -o 'Name'
      configSetup: User assigned to active Lightning Sync configuration... Yes
      userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
      userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
      userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
      `
    ]; */

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

    /*     const jsonParsed = {};
        tables.csad.forEach(value => {
          const keyval = value[Object.keys(value)[0]];
          delete value[Object.keys(value)[0]];
          jsonParsed[keyval] = value;
        });
        await this.ux.styledJSON(jsonParsed); */

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
              cells[table.rows[0].cells[c].innerText.replace(/(\n|\t| )/g, '')] = table.rows[r].cells[
                c
              ].innerText.replace(/(:\t|\t)/g, '');
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Uploaded By') {
                cells[table.rows[0].cells[c].innerText.replace(/(\n|\t| )/g, '')] = table.rows[r].cells[
                  c
                ].innerText.replace(/( @.*)/g, '');
              }
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Description') {
                cells['HTMLDescription'] = table.rows[r].cells[c].innerHTML;
              }
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Change Set Name') {
                const div = document.createElement('div');
                div.innerHTML = table.rows[r].cells[c].innerHTML;
                cells['DetailPage'] = (div.firstChild as Element).getAttribute('href');
              }
              if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Source Organization') {
                const div = document.createElement('div');
                div.innerHTML = table.rows[r].cells[c].innerHTML;
                cells['SourceOrganizationID'] = (div.firstChild as Element).getAttribute('href').split('id=')[1];
              }
            }
            rows.push(cells);
          }
        }
        return rows;
      };
      return {
        csad: converttable(
          document,
          'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:AwaitingDeploymentPageBlock:ListUnDeployedInboundChangeSetBlockSection:UnDeployedInboundChangeSetList'
        ),
        dcs: converttable(
          document,
          'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:DeployedPageBlock:ListDeployedInboundChangeSetBlockSection:DeployedInboundChangeSetList'
        )
      };
    });
  }
}
