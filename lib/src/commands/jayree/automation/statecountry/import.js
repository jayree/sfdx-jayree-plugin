"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@salesforce/command");
// import ProgressBar = require('progress');
const puppeteer = require("puppeteer");
const tabletojson = require("tabletojson");
const config = require("../../../../../config/countrystate.json");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');
class CreateUpdateStateCountry extends command_1.SfdxCommand {
    async run() {
        var e_1, _a, e_2, _b;
        let spinnermessage = '';
        const browser = await puppeteer.launch({
            headless: true
        });
        const page = await browser.newPage();
        const setHTMLInputElementValue = async (newvalue, element) => {
            const elementDisabled = await page.evaluate(s => {
                const result = document.querySelector(s.replace(/:/g, '\\:'));
                if (result != null) {
                    return result['disabled'];
                }
                else {
                    return true;
                }
            }, element);
            if (!elementDisabled) {
                return page.evaluate((val, s) => (document.querySelector(s.replace(/:/g, '\\:')).value = val), newvalue, element);
            }
            else {
                return new Promise(resolve => {
                    resolve();
                });
            }
        };
        const setHTMLInputElementChecked = async (element, newstate, waitForEnable) => {
            const elementCheckedState = await page.evaluate(s => {
                return document.querySelector(s.replace(/:/g, '\\:'))['checked'];
            }, element);
            // this.ux.log('elementCheckedState: ' + element + ' ' + elementCheckedState);
            if (!elementCheckedState === newstate) {
                if (waitForEnable) {
                    await page.waitFor(s => {
                        const val = document.querySelector(s.replace(/:/g, '\\:'))['disabled'];
                        return val === false;
                    }, {
                        timeout: 0
                    }, element);
                }
                const elementDisabledState = await page.evaluate(s => {
                    return document.querySelector(s.replace(/:/g, '\\:'))['disabled'];
                }, element);
                // this.ux.log('elementDisabledState: ' + element + ' ' + elementDisabledState);
                if (!elementDisabledState) {
                    return page.click(element.replace(/:/g, '\\:'));
                }
                else {
                    return new Promise(resolve => {
                        resolve();
                    });
                }
            }
            else {
                return new Promise(resolve => {
                    resolve();
                });
            }
        };
        try {
            !this.flags.silent
                ? this.ux.startSpinner(`State and Country/Territory Picklist: ${this.flags.countrycode.toUpperCase()}`)
                : process.stdout.write(`State and Country/Territory Picklist: ${this.flags.countrycode.toUpperCase()}`);
            spinnermessage = `get data from ISO.org`;
            !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
            try {
                await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.flags.countrycode.toUpperCase()}`, {
                    waitUntil: 'networkidle0'
                });
                await page.waitFor('.tablesorter');
            }
            catch (error) {
                throw Error(`The country code element (${this.flags.countrycode.toUpperCase()}) was not found`);
            }
            const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);
            const converted = tabletojson.convert(table)[0];
            const jsonParsed = {};
            if (typeof converted !== 'undefined') {
                converted.forEach(value => {
                    const keyval = value[Object.keys(value)[0]];
                    delete value[Object.keys(value)[0]];
                    if (jsonParsed[keyval] === undefined) {
                        jsonParsed[keyval] = [];
                    }
                    jsonParsed[keyval].push(value);
                });
            }
            if (Object.keys(jsonParsed).includes(this.flags.category)) {
                const languagecodes = jsonParsed[this.flags.category]
                    .map(v => v['Language code'])
                    .filter((v, i, s) => s.indexOf(v) === i);
                if (!languagecodes.includes(this.flags.language)) {
                    throw Error('Expected --language to be one of: ' + languagecodes.toString());
                }
                const conn = this.org.getConnection();
                spinnermessage = `login to ${conn.instanceUrl}`;
                !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
                await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
                    waitUntil: 'networkidle0'
                });
                let total = jsonParsed[this.flags.category].map(v => v['Language code']).length;
                const start = new Date();
                let percent = 0;
                let eta = 0;
                let elapsed = 0;
                let curr = 0;
                let ratio = 0;
                if (config.deactivate[this.flags.countrycode.toUpperCase()]) {
                    if (config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category]) {
                        total = total + config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category].length;
                        try {
                            for (var _c = tslib_1.__asyncValues(config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category]), _d; _d = await _c.next(), !_d.done;) {
                                const value = _d.value;
                                const countrycode = value.split('-')[0];
                                const stateIsoCode = value.split('-')[1].split('*')[0];
                                try {
                                    await page.goto(conn.instanceUrl +
                                        `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`, {
                                        waitUntil: 'networkidle0'
                                    });
                                    const updatecheck = await page.evaluate(c => {
                                        const result = document.querySelector(c.updatecheck);
                                        if (result != null) {
                                            return result.innerText;
                                        }
                                        else {
                                            return null;
                                        }
                                    }, config);
                                    if (updatecheck === 'Unable to Access Page') {
                                        throw Error('no update possible');
                                    }
                                }
                                catch (error) {
                                    continue;
                                }
                                spinnermessage =
                                    percent.toFixed(0) +
                                        '% - ' +
                                        (elapsed / 1000).toFixed(1) +
                                        's/' +
                                        (isNaN(eta) || !isFinite(eta) ? '0.0' : (eta / 1000).toFixed(1)) +
                                        's - ' +
                                        'deactivate ' +
                                        value;
                                !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
                                const selector = config.update;
                                await setHTMLInputElementChecked(selector.editVisible, false, false);
                                await setHTMLInputElementChecked(selector.editActive, false, false);
                                await page.click(selector.save.replace(/:/g, '\\:'));
                                await page.waitForNavigation({
                                    waitUntil: 'networkidle0'
                                });
                                curr = curr + 1;
                                ratio = curr / total;
                                ratio = Math.min(Math.max(ratio, 0), 1);
                                percent = Math.floor(ratio * 100);
                                // tslint:disable-next-line: no-any
                                elapsed = new Date() - start;
                                eta = percent === 100 ? 0 : elapsed * (total / curr - 1);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_a = _c.return)) await _a.call(_c);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                }
                try {
                    /*         const bar = new ProgressBar('[:bar] :percent :etas', {
                      complete: '=',
                      incomplete: ' ',
                      total: jsonParsed[this.flags.category].map(v => v['Language code']).length
                    }); */
                    for (var _e = tslib_1.__asyncValues(jsonParsed[this.flags.category]), _f; _f = await _e.next(), !_f.done;) {
                        const value = _f.value;
                        const language = value['Language code'];
                        if (this.flags.language === language) {
                            const countrycode = value['3166-2 code'].split('-')[0];
                            const stateintVal = value['3166-2 code'].split('*')[0];
                            let stateIsoCode = value['3166-2 code'].split('-')[1].split('*')[0];
                            const stateName = this.flags.uselocalvariant && value['Local variant'] !== ''
                                ? value['Local variant']
                                : value['Subdivision name'];
                            if (Object.keys(config.fix).includes(countrycode)) {
                                if (Object.keys(config.fix[countrycode]).includes(stateIsoCode)) {
                                    // this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${config.fix[countrycode][stateIsoCode]}`);
                                    stateIsoCode = config.fix[countrycode][stateIsoCode];
                                }
                            }
                            let update;
                            try {
                                update = true;
                                await page.goto(conn.instanceUrl +
                                    `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`, {
                                    waitUntil: 'networkidle0'
                                });
                                const updatecheck = await page.evaluate(c => {
                                    const result = document.querySelector(c.updatecheck);
                                    if (result != null) {
                                        return result.innerText;
                                    }
                                    else {
                                        return null;
                                    }
                                }, config);
                                if (updatecheck === 'Unable to Access Page') {
                                    throw Error('no update possible');
                                }
                            }
                            catch (error) {
                                update = false;
                                await page.goto(conn.instanceUrl +
                                    `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`, {
                                    waitUntil: 'networkidle0'
                                });
                            }
                            finally {
                                spinnermessage =
                                    percent.toFixed(0) +
                                        '% - ' +
                                        (elapsed / 1000).toFixed(1) +
                                        's/' +
                                        (isNaN(eta) || !isFinite(eta) ? '0.0' : (eta / 1000).toFixed(1)) +
                                        's - ' +
                                        (update ? 'update ' : 'create ') +
                                        stateName +
                                        '/' +
                                        stateintVal;
                                !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
                                const selector = update ? config.update : config.create;
                                await setHTMLInputElementValue(stateName, selector.editName);
                                await setHTMLInputElementValue(stateIsoCode, selector.editIsoCode);
                                await setHTMLInputElementValue(stateintVal, selector.editIntVal);
                                await setHTMLInputElementChecked(selector.editActive, true, false);
                                await setHTMLInputElementChecked(selector.editVisible, true, true);
                                await page.click(selector.save.replace(/:/g, '\\:'));
                                await page.waitForNavigation({
                                    waitUntil: 'networkidle0'
                                });
                            }
                        }
                        // bar.tick();
                        curr = curr + 1;
                        ratio = curr / total;
                        ratio = Math.min(Math.max(ratio, 0), 1);
                        percent = Math.floor(ratio * 100);
                        // tslint:disable-next-line: no-any
                        elapsed = new Date() - start;
                        eta = percent === 100 ? 0 : elapsed * (total / curr - 1);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) await _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                spinnermessage = percent.toFixed(0) + '% - ' + (elapsed / 1000).toFixed(1) + 's';
                // this.ux.stopSpinner(spinnermessage);
            }
            else {
                throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
            }
        }
        catch (error) {
            throw error;
        }
        finally {
            !this.flags.silent ? this.ux.stopSpinner(spinnermessage) : process.stdout.write('.');
            await browser.close();
        }
        return {};
    }
}
exports.default = CreateUpdateStateCountry;
CreateUpdateStateCountry.aliases = ['jayree:automation:statecountry:create', 'jayree:automation:statecountry:update'];
CreateUpdateStateCountry.description = messages.getMessage('commandDescription');
/*   public static examples = [
    `$ sfdx jayree:automation:usersyncstatus -o 'Name'
    configSetup: User assigned to active Lightning Sync configuration... Yes
    userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
    userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
    userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
    `
  ]; */
CreateUpdateStateCountry.flagsConfig = {
    countrycode: command_1.flags.string({
        description: messages.getMessage('countrycodeFlagDescription'),
        required: true
    }),
    category: command_1.flags.string({
        description: messages.getMessage('categoryFlagDescription'),
        required: true
    }),
    language: command_1.flags.string({
        description: messages.getMessage('languageFlagDescription'),
        required: true
    }),
    uselocalvariant: command_1.flags.boolean({
        description: messages.getMessage('uselocalvariantFlagDescription'),
        required: false,
        default: false
    }),
    silent: command_1.flags.boolean({
        description: messages.getMessage('silentFlagDescription'),
        required: false,
        default: false,
        hidden: true
    })
};
CreateUpdateStateCountry.requiresUsername = true;
CreateUpdateStateCountry.supportsDevhubUsername = false;
CreateUpdateStateCountry.requiresProject = false;
//# sourceMappingURL=import.js.map