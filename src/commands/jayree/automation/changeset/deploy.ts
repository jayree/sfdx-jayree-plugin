import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import inquirer = require('inquirer');
import puppeteer = require('puppeteer');

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  ((Symbol as any)['asyncIterator']) = Symbol.for('asyncIterator');
}

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'deploychangeset');
export default class DeployChangeSet extends SfdxCommand {

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
    changeset: flags.string({ char: 's', description: messages.getMessage('changesetFlagDescription'), required: false }),
    runtests: flags.string({ char: 'r', description: messages.getMessage('runtestsFlagDescription'), required: false, dependsOn: ['testlevel'] }),
    testlevel: flags.string({ char: 'l', description: messages.getMessage('testlevelFlagDescription'), required: false, options: ['Default', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'] }),
    checkonly: flags.boolean({ char: 'c', description: messages.getMessage('checkonlyFlagDescription'), required: false }),
    nodialog: flags.boolean({ description: messages.getMessage('checkonlyFlagDescription'), required: false, dependsOn: ['changeset', 'testlevel'] })
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

    let jobid;

    try {
      const page = await browser.newPage();

      await this.login(conn, page);

      jobid = await this.getjobid(conn, page);

      if (jobid) {
        throw Error('a deployment is already running with jobid ' + jobid);
      } else {
        await page.goto(conn.instanceUrl + '/changemgmt/listInboundChangeSet.apexp', {
          waitUntil: 'networkidle2'
        });

        const tables = await this.gettables(page);

        let sCS;

        if (!this.flags.nodialog) {
          const questions = [
            {
              type: 'list',
              message: 'Change Sets Awaiting Deployment',
              name: 'selectedChangeSet',
              choices: tables.csad.map(element => ({ name: element['Change Set Name'] })),
              default: this.flags.changeset
            },
            {
              type: 'list',
              name: 'selectedMode',
              message: 'Validate or Deploy?',
              choices: ['Validate', 'Deploy'],
              default: () => this.flags.checkonly ? 'Validate' : 'Deploy'
            },
            {
              type: 'list',
              name: 'testlevel',
              message: 'Choose a Test Option',
              choices: ['Default', 'Run Local Tests', 'Run All Tests In Org', 'Run Specified Tests'],
              default: () => this.flags.testlevel ? this.flags.testlevel.replace(/([A-Z])/g, ' $1').trim() : 'Default',
              filter: val => {
                return val.replace(/( )/g, '');
              }
            },
            {
              type: 'input',
              name: 'runtests',
              message: 'Only the tests that you specify are run. Provide the names of test classes in a comma-separated list:',
              default: this.flags.runtests,
              when: answers => {
                return answers.testlevel === 'RunSpecifiedTests';
              },
              validate: answer => {
                if (answer.length < 1) {
                  return 'You must specify at least one test.';
                }
                return true;
              }
            }
          ];

          sCS = await inquirer.prompt(questions).then(answers => {
            return answers;
          });
        } else {
          sCS = { selectedChangeSet: this.flags.changeset, selectedMode: this.flags.checkonly ? 'Validate' : 'Deploy', testlevel: this.flags.testlevel };
          if (this.flags.testlevel === 'RunSpecifiedTests') {
            if (!this.flags.runtests) {
              throw Error('INVALID_OPERATION: runTests must not be empty when a testLevel of RunSpecifiedTests is used.');
            } else {
              sCS['runtests'] = this.flags.runtests;
            }
          }
        }

        // console.log(sCS);
        const changeset = tables.csad.filter(element => sCS.selectedChangeSet.includes(element['Change Set Name']))[0];
        // for await (const changeset of tables.csad.filter(element => sCS.selectedChangeSet.includes(element['Change Set Name']))) {
        // console.log(changeset);
        if (!changeset) {
          throw Error('Change Set ' + sCS.selectedChangeSet + ' not found!');
        }
        // open detail page
        await page.goto(conn.instanceUrl + changeset.DetailPage, {
          waitUntil: 'networkidle2'
        });

        await this.clickvalidateordeploy(page, sCS.selectedMode);

        switch (sCS.testlevel) {
          case 'Default':
            await this.selecttest(page, '0');
            break;
          case 'RunSpecifiedTests':
            await this.selecttest(page, '3', sCS.runtests);
            break;
          case 'RunLocalTests': {
            await this.selecttest(page, '1');
            break;
          }
          case 'RunAllTestsInOrg':
            await this.selecttest(page, '2');
            break;
          default:
            await this.selecttest(page, '0');
        }

        await this.clickvalidateordeploy2(page, sCS.selectedMode);

        jobid = await this.getjobid(conn, page);
        // console.log(`sfdx force:mdapi:deploy:report -i ${jobId} -u ${conn.getUsername()} --json`);
        this.ux.log(`Deploying Change Set ${sCS.selectedChangeSet}...`);
        this.ux.log('');
        this.ux.styledHeader('Status');
        this.ux.log('Status:  Queued');
        this.ux.log('jobid:  ' + jobid);
        // }

      }
    } catch (error) {
      throw error;
    } finally {
      await browser.close();
    }

    return { done: false, id: jobid, state: 'Queued', status: 'Queued', timedOut: true };
  }

  private async login(conn: core.Connection, page: puppeteer.Page) {
    await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
      waitUntil: 'networkidle2'
    });
  }

  private async selecttest(page: puppeteer.Page, index: string, runtests: string = '') {
    await page.evaluate((i: string) => {
      document.getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:deploymentTestLevel:' + i).click();
    }, index);
    if (runtests !== '') {
      await page.waitForSelector('textarea[name="inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:j_id7"]');
      await page.focus('textarea[name="inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:j_id7"]');
      await page.keyboard.type(runtests);
    }
  }

  private async clickvalidateordeploy(page: puppeteer.Page, selectedMode: string) {
    if (selectedMode === 'Validate') {
      // click on validate
      await page.evaluate(() => {
        document.getElementById('inboundChangeSetDetailPage:inboundChangeSetDetailPageBody:inboundChangeSetDetailPageBody:detail_form:ics_detail_block:form_buttons:validate_button').click();
      });
    } else {
      // click on deploy
      await page.evaluate(() => {
        document.getElementById('inboundChangeSetDetailPage:inboundChangeSetDetailPageBody:inboundChangeSetDetailPageBody:detail_form:ics_detail_block:form_buttons:deploy_button').click();
      });
    }
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
  }

  private async clickvalidateordeploy2(page: puppeteer.Page, selectedMode: string) {
    if (selectedMode === 'Validate') {
      // click on validate
      await page.evaluate(() => {
        document.getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:form_buttons:validate_button').click();
      });
    } else {
      // click on deploy
      await page.evaluate(() => {
        document.getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:form_buttons:deploy_button').click();
      });
    }
    // click on ok
    await page.waitFor('#simpleDialog0button0');
    await page.evaluate(() => {
      document.getElementById('simpleDialog0button0').click();
    });
    await page.waitForNavigation({
      waitUntil: 'networkidle2'
    });
  }

  private async getjobid(conn: core.Connection, page: puppeteer.Page) {
    // open deployment status
    await page.goto(conn.instanceUrl + '/changemgmt/monitorDeployment.apexp', {
      waitUntil: 'networkidle2'
    });
    try {
      return await page.evaluate(() => {
        return (document.getElementById('viewErrors') as HTMLElement).getAttribute('onclick').split('asyncId=')[1].split("'")[0];
      });
    } catch {
      return false;
    }
  }

  private async gettables(page: puppeteer.Page) {
    return await page.evaluate(() => {

      const converttable = (document: Document, tableid: string) => {
        const rows = [];
        if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid) != null) {
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
