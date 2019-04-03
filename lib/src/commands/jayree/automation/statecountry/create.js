"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@salesforce/command");
const puppeteer = require("puppeteer");
const tabletojson = require("tabletojson");
if (Symbol['asyncIterator'] === undefined) {
    // tslint:disable-next-line:no-any
    Symbol['asyncIterator'] = Symbol.for('asyncIterator');
}
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');
class CreateStateCountry extends command_1.SfdxCommand {
    async run() {
        var e_1, _a;
        const browser = await puppeteer.launch({
            headless: true
        });
        try {
            this.ux.startSpinner('create State and Country/Territory Picklists ' + this.flags.countrycode.toUpperCase());
            this.ux.setSpinnerStatus('receive iso data');
            const page = await browser.newPage();
            await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.flags.countrycode.toUpperCase()}`, {
                waitUntil: 'networkidle2'
            });
            await page.waitFor('.tablesorter');
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
            if (Object.keys(jsonParsed).includes(this.flags.category.toLowerCase())) {
                const conn = this.org.getConnection();
                this.ux.setSpinnerStatus('login to ' + conn.instanceUrl);
                await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
                    waitUntil: 'networkidle2'
                });
                try {
                    for (var _b = __asyncValues(jsonParsed[this.flags.category.toLowerCase()]), _c; _c = await _b.next(), !_c.done;) {
                        const value = _c.value;
                        const language = value['Language code'];
                        if (this.flags.language.toLowerCase() === language) {
                            const countrycode = value['3166-2 code'].split('-')[0];
                            const stateintVal = value['3166-2 code'].split('*')[0];
                            const stateIsoCode = value['3166-2 code'].split('-')[1].split('*')[0];
                            const stateName = this.flags.uselocalvariant && value['Local variant'] !== ''
                                ? value['Local variant']
                                : value['Subdivision name'];
                            this.ux.setSpinnerStatus((this.flags.update ? 'update ' : 'create ') + stateName + '/' + stateintVal);
                            const setupurl = this.flags.update
                                ? `i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`
                                : `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`;
                            await page.goto(conn.instanceUrl + setupurl, {
                                waitUntil: 'networkidle2'
                            });
                            await page.evaluate(val => (document.querySelector('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a nameSectionItem\\3a editName').value = val), stateName);
                            await page.evaluate(val => (document.querySelector('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a codeSectionItem\\3a editIsoCode').value = val), stateIsoCode);
                            await page.evaluate(val => (document.querySelector('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a intValSectionItem\\3a editIntVal').value = val), stateintVal);
                            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a activeSectionItem\\3a editActive');
                            await page.waitFor(() => {
                                const val = document.querySelector('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a visibleSectionItem\\3a editVisible')['disabled'];
                                return val === false;
                            }, {
                                timeout: 0
                            });
                            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a visibleSectionItem\\3a editVisible');
                            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id43\\3a addButton');
                            await page.waitForNavigation({
                                waitUntil: 'networkidle0',
                                timeout: 0
                            });
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
            }
        }
        catch (error) {
            this.ux.stopSpinner('error');
            throw error;
        }
        finally {
            await browser.close();
        }
        return {};
    }
}
CreateStateCountry.description = messages.getMessage('commandDescription');
/*   public static examples = [
    `$ sfdx jayree:automation:usersyncstatus -o 'Name'
    configSetup: User assigned to active Lightning Sync configuration... Yes
    userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
    userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
    userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
    `
  ]; */
CreateStateCountry.flagsConfig = {
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
    update: command_1.flags.boolean({
        description: messages.getMessage('updateFlagDescription'),
        required: false,
        default: false
    }),
    uselocalvariant: command_1.flags.boolean({
        description: messages.getMessage('uselocalvariantFlagDescription'),
        required: false,
        default: false
    })
};
CreateStateCountry.requiresUsername = true;
CreateStateCountry.supportsDevhubUsername = false;
CreateStateCountry.requiresProject = false;
exports.default = CreateStateCountry;
//# sourceMappingURL=create.js.map