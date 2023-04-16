/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { createRequire } from 'module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { ux } from '@oclif/core';
import playwright from 'playwright-chromium';
import { Tabletojson as tabletojson } from 'tabletojson';
import config from '../../../../utils/config.js';

const require = createRequire(import.meta.url);
const CSconfig = require('../../../../../config/countrystate.json');

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'createstatecountry');

export default class UpdateCountry extends SfdxCommand {
  public static description = messages.getMessage('commandCountryDescription');

  protected static flagsConfig = {
    silent: flags.boolean({
      description: messages.getMessage('silentFlagDescription'),
      required: false,
      default: false,
      hidden: true,
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<void> {
    let spinnermessage = '';

    const browser = await playwright['chromium'].launch(config().puppeteer);
    const context = await browser.newContext();

    const page = await context.newPage();

    const setHTMLInputElementValue = async (newvalue, element) => {
      element = element.replace(/:/g, '\\:');
      const elementDisabled = await page.evaluate((s) => {
        const result = document.querySelector(s);
        if (result != null) {
          return result['disabled'];
        } else {
          return true;
        }
      }, element);
      // const currentvalue = await page.evaluate(s => (document.querySelector(s) as HTMLInputElement).value, element);
      if (!elementDisabled) {
        return page.fill(element, newvalue);
      }
    };

    const bar = ux.progress({
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
        waitUntil: 'networkidle',
      });

      spinnermessage = 'retrieve list of countries';
      // eslint-disable-next-line no-unused-expressions
      !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');

      try {
        await page.goto(conn.instanceUrl + '/i18n/ConfigStateCountry.apexp?setupid=AddressCleanerOverview', {
          waitUntil: 'networkidle',
        });
        await page.waitForSelector('.list', { state: 'visible' });
      } catch (error) {
        throw Error("list of countries couldn't be loaded");
      }
      this.ux.stopSpinner();

      const table = await page.evaluate(() => document.querySelector('.list').outerHTML);

      const list = tabletojson.convert(table)[0];

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
        await page.goto(
          conn.instanceUrl + `/i18n/ConfigureCountry.apexp?countryIso=${countryCode}&setupid=AddressCleanerOverview`,
          {
            waitUntil: 'networkidle',
          }
        );
        const setCountrySelector = CSconfig.setCountry;
        await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);

        await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
        await page.waitForSelector('.message.confirmM3', { state: 'visible' });
      }
    } catch (error) {
      throw new Error(error.message);
    } finally {
      // eslint-disable-next-line no-unused-expressions
      !this.flags.silent ? bar.update(bar.getTotal(), { text: '' }) : process.stdout.write('.');

      this.ux.stopSpinner();
      bar.stop();
      if (page) {
        await page.close();
        if (browser) {
          await browser.close();
        }
      }
    }
  }
}
