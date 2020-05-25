import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as chalk from 'chalk';
import { cli } from 'cli-ux';
import puppeteer = require('puppeteer');
import { Tabletojson as tabletojson } from 'tabletojson';
import config = require('../../../../../config/countrystate.json');

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');

export default class UpdateCountry extends SfdxCommand {
  public static description = messages.getMessage('commandCountryDescription');

  protected static flagsConfig = {
    silent: flags.boolean({
      description: messages.getMessage('silentFlagDescription'),
      required: false,
      default: false,
      hidden: true
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    let spinnermessage = '';

    const browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();

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
        return page.evaluate(
          (val, s) => ((document.querySelector(s) as HTMLInputElement).value = val),
          newvalue,
          element
        );
      } else {
        return new Promise((resolve) => {
          resolve();
        });
      }
    };

    const bar = cli.progress({
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      format: `State and Country/Territory Picklist | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {text}`,
      stream: process.stdout
    });

    try {
      !this.flags.silent
        ? this.ux.startSpinner(`State and Country/Territory Picklist`)
        : process.stdout.write(`State and Country/Territory Picklist`);

      await this.org.refreshAuth();
      const conn = this.org.getConnection();

      spinnermessage = `login to ${conn.instanceUrl}`;
      !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
      await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
        waitUntil: 'networkidle0'
      });

      spinnermessage = `retrieve list of countries`;
      !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');

      try {
        await page.goto(conn.instanceUrl + `/i18n/ConfigStateCountry.apexp?setupid=AddressCleanerOverview`, {
          waitUntil: 'networkidle0'
        });
        await page.waitFor('.list', { visible: true });
      } catch (error) {
        throw Error(`list of countries couldn't be loaded`);
      }
      this.ux.stopSpinner();

      const table = await page.evaluate(() => document.querySelector('.list').outerHTML);

      const list = tabletojson.convert(table)[0];

      let curr = 0;

      if (!this.flags.silent) {
        bar.start(list.length, 0, {
          text: ''
        });
      }

      for await (const value of list) {
        const cCodeKey = Object.keys(value)[4];
        const cNameKey = Object.keys(value)[3];
        const countryCode = value[cCodeKey];
        const countryName = value[cNameKey];

        curr = curr + 1;
        !this.flags.silent
          ? bar.update(curr, {
              text: 'update ' + countryName + '/' + countryCode
            })
          : process.stdout.write('.');
        await page.goto(
          conn.instanceUrl + `/i18n/ConfigureCountry.apexp?countryIso=${countryCode}&setupid=AddressCleanerOverview`,
          {
            waitUntil: 'networkidle0'
          }
        );
        const setCountrySelector = config.setCountry;
        await setHTMLInputElementValue(countryCode, setCountrySelector.editIntVal);

        await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
        await page.waitForNavigation({
          waitUntil: 'networkidle0'
        });
      }
    } catch (error) {
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
