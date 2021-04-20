"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerTasks2 = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const tabletojson_1 = require("tabletojson");
const config = tslib_1.__importStar(require("../../config/countrystate.json"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:x:y');
class PuppeteerTasks2 {
    constructor(auth) {
        this.nextAddTaskIndex = -1;
        this.nextDeactivateTaskIndex = -1;
        this.auth = auth;
    }
    static async setHTMLInputElementValue(page, element, newvalue) {
        element = element.replace(/:/g, '\\:');
        const elementCurrentValue = await page.evaluate((s) => {
            const result = document.querySelector(s);
            if (result != null) {
                return result.value;
            }
            else {
                return '';
            }
        }, element);
        if (!(elementCurrentValue === newvalue)) {
            const elementDisabled = await page.evaluate((s) => {
                const result = document.querySelector(s);
                if (result != null) {
                    return result['disabled'];
                }
                else {
                    return true;
                }
            }, element);
            if (!elementDisabled) {
                await page.evaluate((val, s) => (document.querySelector(s).value = val), newvalue, element);
                return 'changed';
            }
            else {
                return 'disabled';
            }
        }
        else {
            return 'unchanged';
        }
    }
    static async setHTMLInputElementChecked(page, element, newstate, waitForEnable) {
        element = element.replace(/:/g, '\\:');
        const elementCheckedState = await page.evaluate((s) => {
            return document.querySelector(s)['checked'];
        }, element);
        if (!elementCheckedState === newstate) {
            if (waitForEnable) {
                await page.waitForFunction((s) => {
                    const val = document.querySelector(s)['disabled'];
                    return val === false;
                }, {
                    timeout: 0,
                }, element);
            }
            const elementDisabledState = await page.evaluate((s) => {
                return document.querySelector(s)['disabled'];
            }, element);
            if (!elementDisabledState) {
                await page.click(element);
                return 'changed';
            }
            else {
                return 'disabled';
            }
        }
        else {
            return 'unchanged';
        }
    }
    async validateParameterCountryCode(countrycode) {
        const page = await this.browser.newPage();
        try {
            if (!this.countries) {
                await page.goto('https://www.iso.org/obp/ui/#search', {
                    waitUntil: 'networkidle0',
                });
                await page.waitForSelector('#gwt-uid-12');
                await page.click('#gwt-uid-12');
                await page.evaluate(() => document.querySelector('#gwt-uid-12')['checked']);
                await page.click('.go');
                await page.waitForSelector('.v-grid-tablewrapper');
                await page.select('.v-select-select', '8');
                await page.waitForFunction(() => document.querySelector('.paging-align-fix').innerHTML === '');
                let converted = [];
                do {
                    const table = await page.evaluate(() => document.querySelector('.v-grid-tablewrapper').outerHTML);
                    converted = tabletojson_1.Tabletojson.convert(table)[0];
                } while (converted.length !== converted.map((x) => x['Alpha-2 code']).filter(Boolean).length);
                this.countries = converted
                    .map((x) => {
                    return { name: `${x['English short name']} (${x['Alpha-2 code']})`, value: x['Alpha-2 code'] };
                })
                    .filter(Boolean)
                    .sort((a, b) => {
                    const x = a.value;
                    const y = b.value;
                    return x < y ? -1 : x > y ? 1 : 0;
                });
            }
            if (this.countries.map((x) => x.value).includes(countrycode)) {
                await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${countrycode}`, {
                    waitUntil: 'networkidle0',
                });
                await page.waitForSelector('.tablesorter', { visible: true });
                this.countrycode = countrycode.toUpperCase();
                const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);
                // eslint-disable-next-line no-shadow
                const converted = tabletojson_1.Tabletojson.convert(table)[0];
                const jsonParsed = {};
                if (typeof converted !== 'undefined') {
                    converted.forEach((value) => {
                        const keyval = value[Object.keys(value)[0]];
                        delete value[Object.keys(value)[0]];
                        if (jsonParsed[keyval] === undefined) {
                            jsonParsed[keyval] = [];
                        }
                        jsonParsed[keyval].push(value);
                    });
                }
                this.ISOData = jsonParsed;
            }
            else {
                this.countrycode = undefined;
            }
        }
        catch (error) {
            debug(error);
        }
        await page.close();
        return { selected: this.countrycode, values: this.countries };
    }
    validateParameterCategory(category) {
        let categories;
        if (this.ISOData) {
            categories = Object.keys(this.ISOData);
        }
        if (categories && categories.includes(category)) {
            this.category = category;
        }
        else if (categories) {
            if (categories.length === 1) {
                this.category = categories[0];
            }
        }
        else {
            this.category = undefined;
        }
        return { selected: this.category, values: categories };
    }
    validateParameterLanguage(language) {
        let languagecodes;
        if (this.category && this.ISOData) {
            languagecodes = this.ISOData[this.category]
                .map((v) => v['Language code'])
                .filter((v, i, s) => s.indexOf(v) === i);
        }
        if (languagecodes && languagecodes.includes(language)) {
            this.language = language;
        }
        else if (languagecodes) {
            if (languagecodes.length === 1) {
                this.language = languagecodes[0];
            }
        }
        else {
            this.language = undefined;
        }
        return { selected: this.language, values: languagecodes };
    }
    async validateParameter(countrycode, category, language) {
        const page = await this.browser.newPage();
        try {
            await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.countrycode}`, {
                waitUntil: 'networkidle0',
            });
            await page.waitForSelector('.tablesorter', { visible: true });
            this.countrycode = countrycode.toUpperCase();
        }
        catch (error) {
            this.countrycode = undefined;
        }
        const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);
        const converted = tabletojson_1.Tabletojson.convert(table)[0];
        const jsonParsed = {};
        if (typeof converted !== 'undefined') {
            converted.forEach((value) => {
                const keyval = value[Object.keys(value)[0]];
                delete value[Object.keys(value)[0]];
                if (jsonParsed[keyval] === undefined) {
                    jsonParsed[keyval] = [];
                }
                jsonParsed[keyval].push(value);
            });
        }
        if (Object.keys(jsonParsed).includes(category)) {
            this.category = category;
            const languagecodes = jsonParsed[category].map((v) => v['Language code']).filter((v, i, s) => s.indexOf(v) === i);
            if (!languagecodes.includes(language)) {
                this.language = undefined;
            }
            else {
                this.language = language;
            }
        }
        else {
            this.category = undefined;
        }
        return { countrycode, category, language };
    }
    getData2() {
        if (this.countrycode === undefined) {
            // throw Error('The country code element was not found');
            throw Error('Expected --countrycode= to be one of: ' + this.countries.map((x) => x.value).toString());
        }
        if (this.category === undefined) {
            throw Error('Expected --category= to be one of: ' + Object.keys(this.ISOData).toString());
        }
        if (this.language === undefined) {
            const languagecodes = this.ISOData[this.category]
                .map((v) => v['Language code'])
                .filter((v, i, s) => s.indexOf(v) === i);
            throw Error('Expected --language to be one of: ' + languagecodes.toString());
        }
        this.addTasks = this.ISOData[this.category].filter((v) => v['Language code'] === this.language);
        this.deactivateTasks = config.deactivate[this.countrycode]
            ? config.deactivate[this.countrycode][this.category]
            : [];
        return { add: this.addTasks, deactivate: this.deactivateTasks };
    }
    async getData(countrycode, category, language) {
        this.countrycode = countrycode.toUpperCase();
        const page = await this.browser.newPage();
        const list = { add: [], deactivate: [] };
        try {
            await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.countrycode}`, {
                waitUntil: 'networkidle0',
            });
            await page.waitForSelector('.tablesorter', { visible: true });
        }
        catch (error) {
            throw Error(`The country code element (${this.countrycode}) was not found`);
        }
        const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);
        const converted = tabletojson_1.Tabletojson.convert(table)[0];
        const jsonParsed = {};
        if (typeof converted !== 'undefined') {
            converted.forEach((value) => {
                const keyval = value[Object.keys(value)[0]];
                delete value[Object.keys(value)[0]];
                if (jsonParsed[keyval] === undefined) {
                    jsonParsed[keyval] = [];
                }
                jsonParsed[keyval].push(value);
            });
        }
        if (Object.keys(jsonParsed).includes(category)) {
            const languagecodes = jsonParsed[category].map((v) => v['Language code']).filter((v, i, s) => s.indexOf(v) === i);
            if (!languagecodes.includes(language)) {
                throw Error('Expected --language to be one of: ' + languagecodes.toString());
            }
            list.add = jsonParsed[category].filter((v) => v['Language code'] === language);
            list.deactivate = config.deactivate[this.countrycode] ? config.deactivate[this.countrycode][category] : [];
        }
        else {
            throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
        }
        this.addTasks = list.add;
        this.deactivateTasks = list.deactivate;
        return list;
    }
    async setCountryIntegrationValue() {
        const page = await this.browser.newPage();
        await page.goto(this.auth.instanceUrl +
            `/i18n/ConfigureCountry.apexp?countryIso=${this.countrycode}&setupid=AddressCleanerOverview`, {
            waitUntil: 'networkidle0',
        });
        const setCountrySelector = config.setCountry;
        const editIntValResult = await PuppeteerTasks2.setHTMLInputElementValue(page, setCountrySelector.editIntVal, this.countrycode);
        debug({ editIntValResult });
        await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        return editIntValResult === 'changed' ? true : false;
    }
    async executeAdd() {
        const task = this.currentAddTask;
        const page = await this.browser.newPage();
        const countrycode = task['3166-2 code'].split('-')[0];
        const stateintVal = task['3166-2 code'].split('*')[0];
        let stateIsoCode = task['3166-2 code'].split('-')[1].split('*')[0];
        const stateName = task['Local variant'] !== '' ? task['Local variant'] : task['Subdivision name'].split('(')[0].trim();
        if (Object.keys(config.fix).includes(countrycode)) {
            if (Object.keys(config.fix[countrycode]).includes(stateIsoCode)) {
                // this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${config.fix[countrycode][stateIsoCode]}`);
                stateIsoCode = config.fix[countrycode][stateIsoCode];
            }
        }
        await page.goto(this.auth.instanceUrl +
            `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`, {
            waitUntil: 'networkidle0',
        });
        let update;
        update = null;
        for (let retries = 0;; retries++) {
            try {
                await page.waitForSelector('.mainTitle', { timeout: 100 });
                update = true;
                // eslint-disable-next-line no-empty
            }
            catch (e) { }
            try {
                await page.waitForSelector('#errorTitle', {
                    timeout: 100,
                });
                update = false;
                // eslint-disable-next-line no-empty
            }
            catch (e) { }
            if (update == null && retries < 600) {
                continue;
            }
            if (update === true || update === false) {
                break;
            }
            throw Error(`faild to open picklist for ${countrycode}`);
        }
        if (update === false) {
            await page.goto(this.auth.instanceUrl +
                `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`, {
                waitUntil: 'networkidle0',
            });
            await page.waitForSelector('.mainTitle');
        }
        const selector = update ? config.update : config.create;
        const editNameResult = await PuppeteerTasks2.setHTMLInputElementValue(page, selector.editName, stateName);
        const editIsoCodeResult = await PuppeteerTasks2.setHTMLInputElementValue(page, selector.editIsoCode, stateIsoCode);
        const editIntValResult = await PuppeteerTasks2.setHTMLInputElementValue(page, selector.editIntVal, stateintVal);
        const editActiveResult = await PuppeteerTasks2.setHTMLInputElementChecked(page, selector.editActive, true, false);
        const editVisibleResult = await PuppeteerTasks2.setHTMLInputElementChecked(page, selector.editVisible, true, true);
        debug({ editNameResult, editIsoCodeResult, editIntValResult, editActiveResult, editVisibleResult });
        await page.click(selector.save.replace(/:/g, '\\:'));
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        await page.close();
        if (update) {
            if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
                return 'updated';
            }
        }
        else {
            if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
                return 'created';
            }
        }
        return 'skipped';
    }
    async executeDeactivate() {
        const task = this.currentDeactivateTask;
        const page = await this.browser.newPage();
        const countrycode = task.split('-')[0];
        const stateIsoCode = task.split('-')[1].split('*')[0];
        await page.goto(this.auth.instanceUrl +
            `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`, {
            waitUntil: 'networkidle0',
        });
        const selector = config.update;
        const editVisibleResult = await PuppeteerTasks2.setHTMLInputElementChecked(page, selector.editVisible, false, false);
        const editActiveResult = await PuppeteerTasks2.setHTMLInputElementChecked(page, selector.editActive, false, false);
        debug({ editVisibleResult, editActiveResult });
        await page.click(selector.save.replace(/:/g, '\\:'));
        await page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
        await page.close();
        return editVisibleResult === 'changed' ? true : false;
    }
    getNextAdd() {
        this.nextAddTaskIndex = this.nextAddTaskIndex + 1;
        this.currentAddTask = this.addTasks[this.nextAddTaskIndex];
        return this;
    }
    getNextDeactivate() {
        this.nextDeactivateTaskIndex = this.nextDeactivateTaskIndex + 1;
        this.currentDeactivateTask = this.deactivateTasks[this.nextDeactivateTaskIndex];
        return this;
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async open() {
        if (!this.browser) {
            if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
                this.browser = await puppeteer_1.default.launch({
                    executablePath: '/usr/bin/chromium-browser',
                    args: ['--disable-dev-shm-usage'],
                });
            }
            else {
                this.browser = await puppeteer_1.default.launch({ headless: true });
            }
            const login = await this.browser.newPage();
            await login.goto(`${this.auth.instanceUrl}/secur/frontdoor.jsp?sid=${this.auth.accessToken}`, {
                waitUntil: 'networkidle0',
                timeout: 300000,
            });
        }
    }
}
exports.PuppeteerTasks2 = PuppeteerTasks2;
//# sourceMappingURL=puppeteer2.js.map