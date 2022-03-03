"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const chalk_1 = __importDefault(require("chalk"));
const cli_ux_1 = require("cli-ux");
const puppeteer_1 = __importDefault(require("puppeteer"));
const tabletojson_1 = require("tabletojson");
const config_1 = __importDefault(require("../../../../utils/config"));
const CSconfig = __importStar(require("../../../../../config/countrystate.json"));
const jayreeSfdxCommand_1 = require("../../../../jayreeSfdxCommand");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'createstatecountry');
class UpdateCountry extends jayreeSfdxCommand_1.JayreeSfdxCommand {
    async run() {
        this.warnIfRunByAlias(UpdateCountry.aliases, UpdateCountry.id);
        let spinnermessage = '';
        const browser = await puppeteer_1.default.launch((0, config_1.default)().puppeteer);
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
                await page.waitForSelector('.list', { visible: true });
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
            for await (const value of list) {
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
                const setCountrySelector = CSconfig.setCountry;
                await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);
                await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
                await page.waitForNavigation({
                    waitUntil: 'networkidle0',
                });
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
            this.ux.error(chalk_1.default.bold('ERROR running jayree:automation:country:update:  ') + chalk_1.default.red(error.message));
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
UpdateCountry.aliases = ['jayree:automation:country:update'];
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
//# sourceMappingURL=country.js.map