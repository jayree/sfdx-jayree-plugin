import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as chalk from 'chalk';
import { cli } from 'cli-ux';
// import ProgressBar = require('progress');
import puppeteer = require('puppeteer');
import { Tabletojson as tabletojson } from 'tabletojson';
import config = require('../../../../../config/countrystate.json');

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');

export default class CreateUpdateStateCountry extends SfdxCommand {
  public static aliases = ['jayree:automation:statecountry:create', 'jayree:automation:statecountry:update'];

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    countrycode: flags.string({
      description: messages.getMessage('countrycodeFlagDescription'),
      required: true
    }),
    category: flags.string({
      description: messages.getMessage('categoryFlagDescription'),
      required: true
    }),
    language: flags.string({
      description: messages.getMessage('languageFlagDescription'),
      required: true
    }),
    uselocalvariant: flags.boolean({
      description: messages.getMessage('uselocalvariantFlagDescription'),
      required: false,
      default: false
    }),
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
      const elementDisabled = await page.evaluate(s => {
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
        return new Promise(resolve => {
          resolve();
        });
      }
    };

    const setHTMLInputElementChecked = async (element, newstate, waitForEnable) => {
      element = element.replace(/:/g, '\\:');
      const elementCheckedState = await page.evaluate(s => {
        return document.querySelector(s)['checked'];
      }, element);
      // this.ux.log('elementCheckedState: ' + element + ' ' + elementCheckedState);
      if (!elementCheckedState === newstate) {
        if (waitForEnable) {
          await page.waitFor(
            s => {
              const val = document.querySelector(s)['disabled'];
              return (val as boolean) === false;
            },
            {
              timeout: 0
            },
            element
          );
        }
        const elementDisabledState = await page.evaluate(s => {
          return document.querySelector(s)['disabled'];
        }, element);
        // this.ux.log('elementDisabledState: ' + element + ' ' + elementDisabledState);
        if (!elementDisabledState) {
          return page.click(element);
        } else {
          return new Promise(resolve => {
            resolve();
          });
        }
      } else {
        return new Promise(resolve => {
          resolve();
        });
      }
    };

    const bar = cli.progress({
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      format: `State and Country/Territory Picklist: ${this.flags.countrycode.toUpperCase()} | [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {text}`,
      stream: process.stdout
    });

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
        await page.waitFor('.tablesorter', { visible: true });
      } catch (error) {
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
        await this.org.refreshAuth();
        const conn = this.org.getConnection();

        spinnermessage = `login to ${conn.instanceUrl}`;
        !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
        await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
          waitUntil: 'networkidle0'
        });

        const list = jsonParsed[this.flags.category].filter(v => v['Language code'] === this.flags.language);
        let curr = 0;

        spinnermessage = `set Integration Value to ${this.flags.countrycode.toUpperCase()}`;
        !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');

        await page.goto(
          conn.instanceUrl +
            `/i18n/ConfigureCountry.apexp?countryIso=${this.flags.countrycode.toUpperCase()}&setupid=AddressCleanerOverview`,
          {
            waitUntil: 'networkidle0'
          }
        );

        const setCountrySelector = config.setCountry;
        await setHTMLInputElementValue(this.flags.countrycode.toUpperCase(), setCountrySelector.editIntVal);

        await page.click(setCountrySelector.save.replace(/:/g, '\\:'));
        await page.waitForNavigation({
          waitUntil: 'networkidle0'
        });

        this.ux.stopSpinner();

        if (
          config.deactivate[this.flags.countrycode.toUpperCase()] &&
          config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category]
        ) {
          if (!this.flags.silent) {
            bar.start(
              list.length + config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category].length,
              0,
              {
                text: ''
              }
            );
          }

          for await (const value of config.deactivate[this.flags.countrycode.toUpperCase()][this.flags.category]) {
            const countrycode = value.split('-')[0];
            const stateIsoCode = value.split('-')[1].split('*')[0];

            await page.goto(
              conn.instanceUrl +
                `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
              {
                waitUntil: 'networkidle0'
              }
            );

            curr = curr + 1;
            !this.flags.silent ? bar.update(curr, { text: 'deactivate ' + value }) : process.stdout.write('.');

            const selector = config.update;

            await setHTMLInputElementChecked(selector.editVisible, false, false);
            await setHTMLInputElementChecked(selector.editActive, false, false);
            await setHTMLInputElementValue(value, selector.editIntVal);

            await page.click(selector.save.replace(/:/g, '\\:'));
            await page.waitForNavigation({
              waitUntil: 'networkidle0'
            });
          }
        } else {
          if (!this.flags.silent) {
            bar.start(list.length, 0, {
              text: ''
            });
          }
        }

        for await (const value of list) {
          const countrycode = value['3166-2 code'].split('-')[0];
          const stateintVal = value['3166-2 code'].split('*')[0];
          let stateIsoCode = value['3166-2 code'].split('-')[1].split('*')[0];
          const stateName =
            this.flags.uselocalvariant && value['Local variant'] !== ''
              ? value['Local variant']
              : value['Subdivision name'].split('(')[0].trim();

          if (Object.keys(config.fix).includes(countrycode)) {
            if (Object.keys(config.fix[countrycode]).includes(stateIsoCode)) {
              // this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${config.fix[countrycode][stateIsoCode]}`);
              stateIsoCode = config.fix[countrycode][stateIsoCode];
            }
          }

          await page.goto(
            conn.instanceUrl +
              `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
            {
              waitUntil: 'networkidle0'
            }
          );

          let update;
          update = null;
          for (let retries = 0; ; retries++) {
            try {
              await page.waitFor('.mainTitle', { timeout: 100 });
              update = true;
            } catch (e) {}

            try {
              await page.waitFor('#errorTitle', {
                timeout: 100
              });
              update = false;
            } catch (e) {}

            if (update == null && retries < 600) {
              continue;
            }
            if (update === true || update === false) {
              break;
            }
            throw Error(`faild to open picklist for ${countrycode}`);
          }

          if (update === false) {
            await page.goto(
              conn.instanceUrl +
                `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`,
              {
                waitUntil: 'networkidle0'
              }
            );
            await page.waitFor('.mainTitle');
          }

          curr = curr + 1;
          !this.flags.silent
            ? bar.update(curr, {
                text: (update ? 'update ' : 'create ') + stateName + '/' + stateintVal
              })
            : process.stdout.write('.');

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
      } else {
        throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
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
      this.ux.error(chalk.bold('ERROR running jayree:automation:statecountry:import:  ') + chalk.red(error.message));
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
