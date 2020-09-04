"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const chalk = tslib_1.__importStar(require("chalk"));
const cli_ux_1 = require("cli-ux");
const puppeteer = require("puppeteer");
const tabletojson_1 = require("tabletojson");
const config = require("../../../../../config/countrystate.json");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');
class UpdateCountry extends command_1.SfdxCommand {
    async run() {
        var e_1, _a;
        let spinnermessage = '';
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        const setHTMLInputElementValue = async (newvalue, element) => {
            element = element.replace(/:/g, '\\:');
            const elementDisabled = await page.evaluate((s) => {
                const result = document.querySelector(s);
                if (result != null) {
                    return result['disabled'];
                }
                else {
                    return true;
                }
            }, element);
            // const currentvalue = await page.evaluate(s => (document.querySelector(s) as HTMLInputElement).value, element);
            if (!elementDisabled) {
                return page.evaluate((val, s) => (document.querySelector(s).value = val), newvalue, element);
            }
            else {
                return new Promise((resolve) => {
                    resolve();
                });
            }
        };
        const bar = cli_ux_1.cli.progress({
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            format: 'State and Country/Territory Picklist | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {text}',
            stream: process.stdout,
        });
        try {
            // eslint-disable-next-line no-unused-expressions
            !this.flags.silent
                ? this.ux.startSpinner('State and Country/Territory Picklist')
                : process.stdout.write('State and Country/Territory Picklist');
            await this.org.refreshAuth();
            const conn = this.org.getConnection();
            spinnermessage = `login to ${conn.instanceUrl}`;
            // eslint-disable-next-line no-unused-expressions
            !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
            await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
                waitUntil: 'networkidle0',
            });
            spinnermessage = 'retrieve list of countries';
            // eslint-disable-next-line no-unused-expressions
            !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
            try {
                await page.goto(conn.instanceUrl + '/i18n/ConfigStateCountry.apexp?setupid=AddressCleanerOverview', {
                    waitUntil: 'networkidle0',
                });
                await page.waitFor('.list', { visible: true });
            }
            catch (error) {
                throw Error("list of countries couldn't be loaded");
            }
            this.ux.stopSpinner();
            const table = await page.evaluate(() => document.querySelector('.list').outerHTML);
            const list = tabletojson_1.Tabletojson.convert(table)[0];
            let curr = 0;
            if (!this.flags.silent) {
                bar.start(list.length, 0, {
                    text: '',
                });
            }
            try {
                for (var list_1 = tslib_1.__asyncValues(list), list_1_1; list_1_1 = await list_1.next(), !list_1_1.done;) {
                    const value = list_1_1.value;
                    const cCodeKey = Object.keys(value)[4];
                    const cNameKey = Object.keys(value)[3];
                    const countryCode = value[cCodeKey];
                    const countryName = value[cNameKey];
                    curr = curr + 1;
                    // eslint-disable-next-line no-unused-expressions
                    !this.flags.silent
                        ? bar.update(curr, {
                            text: 'update ' + countryName + '/' + countryCode,
                        })
                        : process.stdout.write('.');
                    await page.goto(conn.instanceUrl + `/i18n/ConfigureCountry.apexp?countryIso=${countryCode}&setupid=AddressCleanerOverview`, {
                        waitUntil: 'networkidle0',
                    });
                    const setCountrySelector = config.setCountry;
                    await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);
                    await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
                    await page.waitForNavigation({
                        waitUntil: 'networkidle0',
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (list_1_1 && !list_1_1.done && (_a = list_1.return)) await _a.call(list_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            this.ux.stopSpinner();
            bar.stop();
            if (page) {
                await page.close();
                if (browser) {
                    await browser.close();
                }
            }
            this.ux.error(chalk.bold('ERROR running jayree:automation:country:update:  ') + chalk.red(error.message));
            process.exit(1);
        }
        // eslint-disable-next-line no-unused-expressions
        !this.flags.silent ? bar.update(bar.getTotal(), { text: '' }) : process.stdout.write('.');
        bar.stop();
        if (page) {
            await page.close();
            if (browser) {
                await browser.close();
            }
        }
        process.exit(0);
    }
}
exports.default = UpdateCountry;
UpdateCountry.description = messages.getMessage('commandCountryDescription');
UpdateCountry.flagsConfig = {
    silent: command_1.flags.boolean({
        description: messages.getMessage('silentFlagDescription'),
        required: false,
        default: false,
        hidden: true,
    }),
};
UpdateCountry.requiresUsername = true;
UpdateCountry.supportsDevhubUsername = false;
UpdateCountry.requiresProject = false;
//# sourceMappingURL=update.js.map