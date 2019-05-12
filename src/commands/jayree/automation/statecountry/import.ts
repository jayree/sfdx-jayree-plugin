import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
// import ProgressBar = require('progress');
import puppeteer = require('puppeteer');
import tabletojson = require('tabletojson');
import config = require('../../../../../config/countrystate.json');

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');

export default class CreateUpdateStateCountry extends SfdxCommand {
  public static aliases = ['jayree:automation:statecountry:create', 'jayree:automation:statecountry:update'];

  public static description = messages.getMessage('commandDescription');

  /*   public static examples = [
      `$ sfdx jayree:automation:usersyncstatus -o 'Name'
      configSetup: User assigned to active Lightning Sync configuration... Yes
      userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
      userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
      userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
      `
    ]; */

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
    try {
      const page = await browser.newPage();

      const setHTMLInputElementValue = async (newvalue, element) => {
        const elementDisabled = await page.evaluate(s => {
          const result = document.querySelector(s.replace(/:/g, '\\:'));
          if (result != null) {
            return result['disabled'];
          } else {
            return true;
          }
        }, element);
        if (!elementDisabled) {
          return page.evaluate(
            (val, s) => ((document.querySelector(s.replace(/:/g, '\\:')) as HTMLInputElement).value = val),
            newvalue,
            element
          );
        } else {
          return new Promise(resolve => {
            resolve();
          });
        }
      };

      const checkHTMLInputElement = async (element, waitForEnable) => {
        const elementState = await page.evaluate(s => {
          return document.querySelector(s.replace(/:/g, '\\:'))['checked'];
        }, element);
        if (!elementState) {
          if (waitForEnable) {
            await page.waitFor(
              s => {
                const val = document.querySelector(s.replace(/:/g, '\\:'))['disabled'];
                return (val as boolean) === false;
              },
              {
                timeout: 0
              },
              element
            );
          }
          return page.click(element.replace(/:/g, '\\:'));
        } else {
          return new Promise(resolve => {
            resolve();
          });
        }
      };

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
        const conn = this.org.getConnection();

        spinnermessage = `login to ${conn.instanceUrl}`;
        !this.flags.silent ? this.ux.setSpinnerStatus(spinnermessage) : process.stdout.write('.');
        await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
          waitUntil: 'networkidle0'
        });

        const total = jsonParsed[this.flags.category].map(v => v['Language code']).length;
        const start = new Date();
        let percent = 0;
        let eta = 0;
        let elapsed = 0;
        let curr = 0;
        let ratio = 0;

        /*         const bar = new ProgressBar('[:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          total: jsonParsed[this.flags.category].map(v => v['Language code']).length
        }); */

        for await (const value of jsonParsed[this.flags.category]) {
          const language = value['Language code'];
          if (this.flags.language === language) {
            const countrycode = value['3166-2 code'].split('-')[0];
            const stateintVal = value['3166-2 code'].split('*')[0];
            let stateIsoCode = value['3166-2 code'].split('-')[1].split('*')[0];
            const stateName =
              this.flags.uselocalvariant && value['Local variant'] !== ''
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
              await page.goto(
                conn.instanceUrl +
                  `/i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`,
                {
                  waitUntil: 'networkidle0'
                }
              );
              const updatecheck = await page.evaluate(c => {
                const result = document.querySelector(c.updatecheck) as HTMLElement;
                if (result != null) {
                  return result.innerText;
                } else {
                  return null;
                }
              }, config);
              if (updatecheck === 'Unable to Access Page') {
                throw Error('no update possible');
              }
            } catch (error) {
              update = false;
              await page.goto(
                conn.instanceUrl +
                  `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`,
                {
                  waitUntil: 'networkidle0'
                }
              );
            } finally {
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
              await checkHTMLInputElement(selector.editActive, false);
              await checkHTMLInputElement(selector.editVisible, true);

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
          elapsed = (new Date() as any) - (start as any);
          eta = percent === 100 ? 0 : elapsed * (total / curr - 1);
        }
        spinnermessage = percent.toFixed(0) + '% - ' + (elapsed / 1000).toFixed(1) + 's';
        // this.ux.stopSpinner(spinnermessage);
      } else {
        throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
      }
    } catch (error) {
      throw error;
    } finally {
      !this.flags.silent ? this.ux.stopSpinner(spinnermessage) : process.stdout.write('.');
      await browser.close();
    }

    return {};
  }
}
