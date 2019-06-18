"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const inquirer_1 = require("inquirer");
const puppeteer = require("puppeteer");
const serializeError = require("serialize-error");
if (Symbol['asyncIterator'] === undefined) {
    // tslint:disable-next-line:no-any
    Symbol['asyncIterator'] = Symbol.for('asyncIterator');
}
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'deploychangeset');
class DeployChangeSet extends command_1.SfdxCommand {
    async run() {
        const conn = this.org.getConnection();
        const browser = await puppeteer.launch({
            headless: true
        });
        let job;
        try {
            const page = await browser.newPage();
            await this.login(conn, page);
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
                        choices: tables.csad.map(element => ({
                            value: element.ChangeSetName,
                            name: element.Description
                                ? `${element.ChangeSetName} - ${element.SourceOrganization} - ${element.UploadedBy} - ${element.UploadedDate} - ${element.Description}`
                                : `${element.ChangeSetName} - ${element.SourceOrganization} - ${element.UploadedBy} - ${element.UploadedDate}`,
                            short: element.ChangeSetName
                        })),
                        default: this.flags.changeset
                    },
                    {
                        type: 'list',
                        name: 'selectedMode',
                        message: 'Choose Validate or Deploy',
                        choices: ['Validate', 'Deploy'],
                        default: () => (this.flags.checkonly ? 'Validate' : 'Deploy')
                    },
                    {
                        type: 'list',
                        name: 'testlevel',
                        message: 'Choose a Test Option',
                        choices: ['Default', 'Run Local Tests', 'Run All Tests In Org', 'Run Specified Tests'],
                        default: () => (this.flags.testlevel ? this.flags.testlevel.replace(/([A-Z])/g, ' $1').trim() : 'Default'),
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
                sCS = await inquirer_1.prompt(questions).then(answers => {
                    return answers;
                });
            }
            else {
                sCS = {
                    selectedChangeSet: this.flags.changeset,
                    selectedMode: this.flags.checkonly ? 'Validate' : 'Deploy',
                    testlevel: this.flags.testlevel
                };
                if (this.flags.testlevel === 'RunSpecifiedTests') {
                    if (!this.flags.runtests) {
                        throw Error('INVALID_OPERATION: runTests must not be empty when a testLevel of RunSpecifiedTests is used.');
                    }
                    else {
                        sCS['runtests'] = this.flags.runtests;
                    }
                }
            }
            // console.log(sCS);
            const changeset = tables.csad.filter(element => sCS.selectedChangeSet.includes(element.ChangeSetName))[0];
            // for await (const changeset of tables.csad.filter(element => sCS.selectedChangeSet.includes(element['Change Set Name']))) {
            // console.log(changeset);
            if (!changeset) {
                throw Error(`Change Set '${sCS.selectedChangeSet}' not found!`);
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
            job = await this.getjob(conn, page, changeset);
            // console.log(job);
            // console.log(`sfdx force:mdapi:deploy:report -i ${jobId} -u ${conn.getUsername()} --json`);
            this.ux.log(`Deploying Change Set '${sCS.selectedChangeSet}'...`);
            this.ux.log('');
            if (changeset.HTMLDescription) {
                this.ux.styledHeader('Description');
                this.ux.log(changeset.HTMLDescription);
                this.ux.log('');
            }
            this.ux.styledHeader('Status');
            this.ux.log('Status: ' + job.status);
            this.ux.log('jobid:  ' + job.id);
            // }
        }
        catch (error) {
            this.logger.error({ error: serializeError(error) });
            throw error;
        }
        finally {
            await browser.close();
        }
        return {
            done: false,
            id: job.id,
            state: job.status,
            status: job.status,
            timedOut: true
        };
    }
    async login(conn, page) {
        await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
            waitUntil: 'networkidle2'
        });
    }
    async selecttest(page, index, runtests = '') {
        await page.evaluate((i) => {
            document
                .getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:deploymentTestLevel:' +
                i)
                .click();
        }, index);
        if (runtests !== '') {
            await page.waitForSelector('textarea[name="inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:j_id7"]');
            await page.focus('textarea[name="inboundChangeSetTestOptions:pageForm:ics_test_level_block:testLevel_section:test_level_sub_section:j_id7"]');
            await page.keyboard.type(runtests);
        }
    }
    async clickvalidateordeploy(page, selectedMode) {
        if (selectedMode === 'Validate') {
            // click on validate
            await page.evaluate(() => {
                document
                    .getElementById('inboundChangeSetDetailPage:inboundChangeSetDetailPageBody:inboundChangeSetDetailPageBody:detail_form:ics_detail_block:form_buttons:validate_button')
                    .click();
            });
        }
        else {
            // click on deploy
            await page.evaluate(() => {
                document
                    .getElementById('inboundChangeSetDetailPage:inboundChangeSetDetailPageBody:inboundChangeSetDetailPageBody:detail_form:ics_detail_block:form_buttons:deploy_button')
                    .click();
            });
        }
        await page.waitForNavigation({
            waitUntil: 'networkidle2'
        });
    }
    async clickvalidateordeploy2(page, selectedMode) {
        if (selectedMode === 'Validate') {
            // click on validate
            await page.evaluate(() => {
                document
                    .getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:form_buttons:validate_button')
                    .click();
            });
        }
        else {
            // click on deploy
            await page.evaluate(() => {
                document
                    .getElementById('inboundChangeSetTestOptions:pageForm:ics_test_level_block:form_buttons:deploy_button')
                    .click();
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
    // tslint:disable-next-line:no-any
    async getjob(conn, page, cs) {
        // open deployment status
        await page.goto(conn.instanceUrl + '/changemgmt/monitorDeployment.apexp', {
            waitUntil: 'networkidle0'
        });
        // try {
        const job = await page.evaluate(csN => {
            let id;
            let currentname;
            // let pendinglist;
            let pendingid;
            let running = false;
            if (typeof document.getElementById('viewErrors') !== 'undefined' && document.getElementById('viewErrors')) {
                id = document
                    .getElementById('viewErrors')
                    .getAttribute('onclick')
                    .split('asyncId=')[1]
                    .split("'")[0];
                running = true;
            }
            if (typeof document.querySelector('#inProgressSummaryContainer > ul > li:nth-child(1)') !== 'undefined' &&
                document.querySelector('#inProgressSummaryContainer > ul > li:nth-child(1)')) {
                currentname = document
                    .querySelector('#inProgressSummaryContainer > ul > li:nth-child(1)')
                    .textContent.replace(/(\t|\n)/g, '')
                    .split(':')[1]
                    .trim();
                running = true;
            }
            // const rows = [];
            if (typeof document.getElementById('MonitorDeploymentsPage:pendingDeploymentsList') !== 'undefined' &&
                document.getElementById('MonitorDeploymentsPage:pendingDeploymentsList')) {
                const table = document.getElementById('MonitorDeploymentsPage:pendingDeploymentsList');
                running = true;
                for (let r = 0, n = table.rows.length; r < n; r++) {
                    const div = document.createElement('div');
                    div.innerHTML = table.rows[r].cells[0].innerHTML;
                    // rows.push({ Action: (div.firstChild as Element).getAttribute('href').split("\'")[1], Name: table.rows[r].cells[1].innerText.replace(/(:\t|\t)/g, '') });
                    if (table.rows[r].cells[1].innerText.replace(/(:\t|\t)/g, '') === csN) {
                        pendingid = div.firstChild.getAttribute('href').split("'")[1];
                    }
                }
            }
            // pendinglist = rows;
            return { id, currentname, pendingid, running };
        }, cs.ChangeSetName);
        this.logger.warn(JSON.stringify(job));
        if (!job.running) {
            // open detail page
            await page.goto(conn.instanceUrl + cs.DetailPage, {
                waitUntil: 'networkidle2'
            });
            const csstatus = await page.evaluate(() => {
                const tableid = 'inboundChangeSetDetailPage:inboundChangeSetDetailPageBody:inboundChangeSetDetailPageBody:detail_form:ics_deploy_history:ics_deploy_history_BlockSection:ics_deploy_history_table';
                // const rows = [];
                if (typeof document.getElementById(tableid) !== 'undefined' && document.getElementById(tableid)) {
                    const table = document.getElementById(tableid);
                    const div = document.createElement('div');
                    div.innerHTML = table.rows[1].cells[0].innerHTML;
                    return {
                        id: div.firstChild
                            .getAttribute('href')
                            .split('asyncId=')[1]
                            .split('&')[0],
                        status: table.rows[1].cells[1].innerText.replace(/(:\t|\t)/g, '').split(': ')[1]
                    };
                }
            });
            return {
                id: csstatus.id,
                name: cs.ChangeSetName,
                status: csstatus.status,
                running: job.running
            };
        }
        if (cs.ChangeSetName === job.currentname) {
            return {
                id: job.id,
                name: job.currentname,
                status: 'InProgress',
                running: job.running
            };
        }
        else {
            return {
                id: job.pendingid,
                name: cs.ChangeSetName,
                status: 'Pending',
                running: job.running
            };
        }
        // } catch {
        //  return false;
        // }
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
                dcs: converttable(document, 'ListInboundChangeSetPage:listInboundChangeSetPageBody:listInboundChangeSetPageBody:ListInboundChangeSetForm:DeployedPageBlock:ListDeployedInboundChangeSetBlockSection:DeployedInboundChangeSetList')
            };
        });
    }
}
DeployChangeSet.description = messages.getMessage('commandDescription');
DeployChangeSet.examples = [
    `$ sfdx jayree:automation:changeset:deploy -s ChangeSet -l RunLocalTests --nodialog
Deploying Change Set 'ChangeSet'...

=== Status
Status: Pending
jobid:  0Xxx100000xx1x1
`,
    `$ sfdx jayree:automation:changeset:deploy
? Change Sets Awaiting Deployment (Use arrow keys)
 ChangeSet3
 ChangeSet2
❯ ChangeSet1
`
];
DeployChangeSet.flagsConfig = {
    changeset: command_1.flags.string({
        char: 's',
        description: messages.getMessage('changesetFlagDescription'),
        required: false
    }),
    runtests: command_1.flags.string({
        char: 'r',
        description: messages.getMessage('runtestsFlagDescription'),
        required: false,
        dependsOn: ['testlevel']
    }),
    testlevel: command_1.flags.string({
        char: 'l',
        description: messages.getMessage('testlevelFlagDescription'),
        required: false,
        options: ['Default', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg']
    }),
    checkonly: command_1.flags.boolean({
        char: 'c',
        description: messages.getMessage('checkonlyFlagDescription'),
        required: false
    }),
    nodialog: command_1.flags.boolean({
        description: messages.getMessage('nodialogFlagDescription'),
        required: false,
        dependsOn: ['changeset']
    })
};
DeployChangeSet.requiresUsername = true;
DeployChangeSet.supportsDevhubUsername = false;
DeployChangeSet.requiresProject = false;
exports.default = DeployChangeSet;
//# sourceMappingURL=deploy.js.map