/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { createRequire } from 'module';
import playwright from 'playwright-chromium';
import { Tabletojson as tabletojson } from 'tabletojson';
import Debug from 'debug';
import config from '../config.js';

const require = createRequire(import.meta.url);
const CSconfig = require('../../../config/countrystate.json');

const debug = Debug('jayree:x:y');

export class PuppeteerStateTasks {
  public currentAddTask;
  public currentDeactivateTask;
  private addTasks: any;
  private deactivateTasks: any;
  private nextAddTaskIndex = -1;
  private nextDeactivateTaskIndex = -1;
  private browser: playwright.Browser;
  private context: playwright.BrowserContext;
  private auth: { instanceUrl: string; accessToken: string };
  private countrycode;
  private countries;
  private language;
  private category;
  private ISOData;

  public constructor(auth) {
    this.auth = auth;
  }

  private static async setHTMLInputElementValue(page: playwright.Page, element: string, newvalue: string) {
    element = element.replace(/:/g, '\\:');
    const elementCurrentValue = await page.evaluate((s) => {
      const result: HTMLInputElement = document.querySelector(s);
      if (result != null) {
        return result.value;
      } else {
        return '';
      }
    }, element);
    if (!(elementCurrentValue === newvalue)) {
      const elementDisabled = await page.evaluate((s) => {
        const result = document.querySelector(s);
        if (result != null) {
          return result['disabled'];
        } else {
          return true;
        }
      }, element);
      if (!elementDisabled) {
        await page.fill(element, newvalue);
        return 'changed';
      } else {
        return 'disabled';
      }
    } else {
      return 'unchanged';
    }
  }

  private static async setHTMLInputElementChecked(
    page: playwright.Page,
    element: string,
    newstate: boolean,
    waitForEnable: boolean
  ) {
    element = element.replace(/:/g, '\\:');
    const elementCheckedState = await page.evaluate((s) => document.querySelector(s)['checked'], element);
    if (!elementCheckedState === newstate) {
      if (waitForEnable) {
        await page.waitForFunction(
          (s) => {
            const val = document.querySelector(s)['disabled'];
            return (val as boolean) === false;
          },
          element,
          {
            timeout: 0,
          }
        );
      }
      const elementDisabledState = await page.evaluate((s) => document.querySelector(s)['disabled'], element);
      if (!elementDisabledState) {
        await page.click(element);
        return 'changed';
      } else {
        return 'disabled';
      }
    } else {
      return 'unchanged';
    }
  }

  public async validateParameterCountryCode(countrycode: string) {
    const page = await this.context.newPage();

    try {
      if (!this.countries) {
        await page.goto('https://www.iso.org/obp/ui/#search', {
          waitUntil: 'networkidle',
        });

        await page.waitForSelector('#gwt-uid-12');
        await page.click('#gwt-uid-12');
        await page.evaluate(() => document.querySelector('#gwt-uid-12')['checked']);
        await page.click('.go');

        await page.waitForSelector('.v-grid-tablewrapper');
        await page.selectOption('.v-select-select', '8');

        await page.waitForFunction(() => document.querySelector('.paging-align-fix').innerHTML === '');

        let converted = [];
        do {
          // eslint-disable-next-line no-await-in-loop
          const table = await page.evaluate(() => document.querySelector('.v-grid-tablewrapper').outerHTML);
          converted = tabletojson.convert(table)[0];
        } while (converted.length !== converted.map((x) => x['Alpha-2 code']).filter(Boolean).length);
        this.countries = converted
          .map((x) => ({ name: `${x['English short name']} (${x['Alpha-2 code']})`, value: x['Alpha-2 code'] }))
          .filter(Boolean)
          .sort((a, b) => {
            const x = a.value;
            const y = b.value;
            return x < y ? -1 : x > y ? 1 : 0;
          });
      }

      if (this.countries.map((x) => x.value).includes(countrycode)) {
        await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${countrycode}`, {
          waitUntil: 'networkidle',
        });
        await page.waitForSelector('.tablesorter', { state: 'visible' });
        this.countrycode = countrycode.toUpperCase();
        const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);

        // eslint-disable-next-line @typescript-eslint/no-shadow
        const converted = tabletojson.convert(table)[0];
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
      } else {
        this.countrycode = undefined;
      }
    } catch (error) {
      debug(error);
    }
    await page.close();

    return { selected: this.countrycode, values: this.countries };
  }

  public validateParameterCategory(category: string) {
    let categories;
    if (this.ISOData) {
      categories = Object.keys(this.ISOData);
    }
    if (categories?.includes(category)) {
      this.category = category;
    } else if (categories) {
      if (categories.length === 1) {
        this.category = categories[0];
      }
    } else {
      this.category = undefined;
    }
    return { selected: this.category, values: categories };
  }

  public validateParameterLanguage(language: string) {
    let languagecodes;
    if (this.category && this.ISOData) {
      languagecodes = this.ISOData[this.category]
        .map((v) => v['Language code'])
        .filter((v, i, s) => s.indexOf(v) === i);
    }
    if (languagecodes?.includes(language)) {
      this.language = language;
    } else if (languagecodes) {
      if (languagecodes.length === 1) {
        this.language = languagecodes[0];
      }
    } else {
      this.language = undefined;
    }
    return { selected: this.language, values: languagecodes };
  }

  public async validateParameter(countrycode: string, category: string, language: string) {
    const page = await this.context.newPage();
    try {
      await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.countrycode}`, {
        waitUntil: 'networkidle',
      });
      await page.waitForSelector('.tablesorter', { state: 'visible' });
      this.countrycode = countrycode.toUpperCase();
    } catch (error) {
      this.countrycode = undefined;
    }

    const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);

    const converted = tabletojson.convert(table)[0];
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
      } else {
        this.language = language;
      }
    } else {
      this.category = undefined;
    }
    return { countrycode, category, language };
  }

  public validateData() {
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
    this.deactivateTasks = CSconfig.deactivate[this.countrycode]
      ? CSconfig.deactivate[this.countrycode][this.category]
      : [];

    return { add: this.addTasks, deactivate: this.deactivateTasks };
  }

  public async getData(countrycode: string, category: string, language: string) {
    this.countrycode = countrycode.toUpperCase();
    const page = await this.context.newPage();
    const list = { add: [], deactivate: [] };
    try {
      await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.countrycode}`, {
        waitUntil: 'networkidle',
      });
      await page.waitForSelector('.tablesorter', { state: 'visible' });
    } catch (error) {
      throw Error(`The country code element (${this.countrycode}) was not found`);
    }

    const table = await page.evaluate(() => document.querySelector('table#subdivision').outerHTML);

    const converted = tabletojson.convert(table)[0];
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
      list.deactivate = CSconfig.deactivate[this.countrycode] ? CSconfig.deactivate[this.countrycode][category] : [];
    } else {
      throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
    }
    this.addTasks = list.add;
    this.deactivateTasks = list.deactivate;
    return list;
  }

  public async setCountryIntegrationValue() {
    const page = await this.context.newPage();

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureCountry.apexp?countryIso=${this.countrycode}&setupid=AddressCleanerOverview`,
      {
        waitUntil: 'networkidle',
      }
    );

    const setCountrySelector = CSconfig.setCountry;
    const editIntValResult = await PuppeteerStateTasks.setHTMLInputElementValue(
      page,
      setCountrySelector.editIntVal,
      this.countrycode
    );
    debug({ editIntValResult });
    await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });
    return editIntValResult === 'changed' ? true : false;
  }

  public async executeAdd(): Promise<string> {
    const task = this.currentAddTask;

    const page = await this.context.newPage();

    const countrycode = task['3166-2 code'].split('-')[0];
    const stateintVal = task['3166-2 code'].split('*')[0];
    let stateIsoCode = task['3166-2 code'].split('-')[1].split('*')[0];
    const stateName =
      task['Local variant'] !== '' ? task['Local variant'] : task['Subdivision name'].split('(')[0].trim();

    if (Object.keys(CSconfig.fix).includes(countrycode)) {
      if (Object.keys(CSconfig.fix[countrycode]).includes(stateIsoCode)) {
        // this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${CSconfig.fix[countrycode][stateIsoCode]}`);
        stateIsoCode = CSconfig.fix[countrycode][stateIsoCode];
      }
    }

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
      {
        waitUntil: 'networkidle',
      }
    );
    let update = true;

    if (await page.$('#errorTitle')) {
      update = false;
    }

    if (update === false) {
      await page.goto(
        this.auth.instanceUrl +
          `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`,
        {
          waitUntil: 'networkidle',
        }
      );
      await page.waitForSelector('.mainTitle');
    }

    const selector = update ? CSconfig.update : CSconfig.create;

    const editNameResult = await PuppeteerStateTasks.setHTMLInputElementValue(page, selector.editName, stateName);
    const editIsoCodeResult = await PuppeteerStateTasks.setHTMLInputElementValue(
      page,
      selector.editIsoCode,
      stateIsoCode
    );
    const editIntValResult = await PuppeteerStateTasks.setHTMLInputElementValue(page, selector.editIntVal, stateintVal);
    const editActiveResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editActive,
      true,
      false
    );
    const editVisibleResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editVisible,
      true,
      true
    );

    debug({ editNameResult, editIsoCodeResult, editIntValResult, editActiveResult, editVisibleResult });

    await page.click(selector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });

    await page.close();

    if (update) {
      if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
        return 'updated';
      }
    } else if (editNameResult === 'changed' || editIntValResult === 'changed' || editVisibleResult === 'changed') {
      return 'created';
    }
    return 'skipped';
  }

  public async executeDeactivate(): Promise<boolean> {
    const task = this.currentDeactivateTask;

    const page = await this.context.newPage();

    const countrycode = task.split('-')[0];
    const stateIsoCode = task.split('-')[1].split('*')[0];

    await page.goto(
      this.auth.instanceUrl +
        `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
      {
        waitUntil: 'networkidle',
      }
    );

    const selector = CSconfig.update;

    const editVisibleResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editVisible,
      false,
      false
    );
    const editActiveResult = await PuppeteerStateTasks.setHTMLInputElementChecked(
      page,
      selector.editActive,
      false,
      false
    );
    debug({ editVisibleResult, editActiveResult });

    await page.click(selector.save.replace(/:/g, '\\:'));
    await page.waitForSelector('.message.confirmM3', { state: 'visible' });

    await page.close();

    return editVisibleResult === 'changed' ? true : false;
  }

  public getNextAdd() {
    this.nextAddTaskIndex = this.nextAddTaskIndex + 1;
    this.currentAddTask = this.addTasks[this.nextAddTaskIndex];
    return this;
  }

  public getNextDeactivate() {
    this.nextDeactivateTaskIndex = this.nextDeactivateTaskIndex + 1;
    this.currentDeactivateTask = this.deactivateTasks[this.nextDeactivateTaskIndex];
    return this;
  }

  public async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  public async open() {
    if (!this.browser) {
      this.browser = await playwright['chromium'].launch(config().puppeteer);
      this.context = await this.browser.newContext();
      const login = await this.context.newPage();
      await login.goto(`${this.auth.instanceUrl}/secur/frontdoor.jsp?sid=${this.auth.accessToken}`, {
        waitUntil: 'networkidle',
        timeout: 300000,
      });
    }
  }
}
