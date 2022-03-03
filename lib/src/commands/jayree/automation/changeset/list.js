"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const puppeteer_1 = __importDefault(require("puppeteer"));
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'listchangeset');
class ViewChangeSets extends command_1.SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const browser = await puppeteer_1.default.launch({
            headless: true,
        });
        const page = await browser.newPage();
        await this.login(conn, page);
        await page.goto(conn.instanceUrl + '/changemgmt/listInboundChangeSet.apexp', {
            waitUntil: 'networkidle2',
        });
        const tables = await this.gettables(page);
        // eslint-disable-next-line @typescript-eslint/await-thenable
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
    async login(conn, page) {
        await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
            waitUntil: 'networkidle2',
        });
    }
    async gettables(page) {
        return await page.evaluate(() => {
            const converttable = (document, tableid) => {
                const rows = [];
                if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
                    const table = document.getElementById(tableid);
                    for (let r = 1, n = table.rows.length; r < n; r++) {
                        const cells = {};
                        for (let c = 1, m = table.rows[r].cells.length; c < m; c++) {
                            cells[table.rows[0].cells[c].innerText.replace(/(\n|\t| )/g, '')] = table.rows[r].cells[c].innerText.replace(/(:\t|\t)/g, '');
                            if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Uploaded By') {
                                cells[table.rows[0].cells[c].innerText.replace(/(\n|\t| )/g, '')] = table.rows[r].cells[c].innerText.replace(/( @.*)/g, '');
                            }
                            if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Description') {
                                cells['HTMLDescription'] = table.rows[r].cells[c].innerHTML;
                            }
                            if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Change Set Name') {
                                const div = document.createElement('div');
                                div.innerHTML = table.rows[r].cells[c].innerHTML;
                                cells['DetailPage'] = div.firstChild.getAttribute('href');
                            }
                            if (table.rows[0].cells[c].innerText.replace(/(\n|\t)/g, '') === 'Source Organization') {
                                const div = document.createElement('div');
                                div.innerHTML = table.rows[r].cells[c].innerHTML;
                                cells['SourceOrganizationID'] = div.firstChild.getAttribute('href').split('id=')[1];
                            }
                        }
                        rows.push(cells);
                    }
                }
                return rows;
            };
            return {
                csad: converttable(document, 'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:AwaitingDeploymentPageBlock:ListUnDeployedInboundChangeSetBlockSection:UnDeployedInboundChangeSetList'),
                dcs: converttable(document, 'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:DeployedPageBlock:ListDeployedInboundChangeSetBlockSection:DeployedInboundChangeSetList'),
            };
        });
    }
}
exports.default = ViewChangeSets;
ViewChangeSets.description = messages.getMessage('commandDescription');
/*   public static examples = [
    `$ sfdx jayree:automation:usersyncstatus -o 'Name'
    configSetup: User assigned to active Lightning Sync configuration... Yes
    userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
    userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
    userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
    `
  ]; */
ViewChangeSets.requiresUsername = true;
ViewChangeSets.supportsDevhubUsername = false;
ViewChangeSets.requiresProject = false;
//# sourceMappingURL=list.js.map