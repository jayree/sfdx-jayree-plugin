import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
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
    })
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const browser = await puppeteer.launch({
      headless: true
    });
    try {
      this.ux.startSpinner('create State and Country/Territory Picklists ' + this.flags.countrycode.toUpperCase());

      this.ux.setSpinnerStatus('receive ISO data');
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

      await page.goto(`https://www.iso.org/obp/ui/#iso:code:3166:${this.flags.countrycode.toUpperCase()}`, {
        waitUntil: 'networkidle0'
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

      if (Object.keys(jsonParsed).includes(this.flags.category)) {
        const languagecodes = jsonParsed[this.flags.category]
          .map(v => v['Language code'])
          .filter((v, i, s) => s.indexOf(v) === i);
        if (!languagecodes.includes(this.flags.language)) {
          throw Error('Expected --language to be one of: ' + languagecodes.toString());
        }
        const conn = this.org.getConnection();

        this.ux.setSpinnerStatus('login to ' + conn.instanceUrl);
        await page.goto(conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken, {
          waitUntil: 'networkidle0'
        });

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
                this.ux.log(`Fix ${stateintVal}: ${stateIsoCode} -> ${config.fix[countrycode][stateIsoCode]}`);
                stateIsoCode = config.fix[countrycode][stateIsoCode];
              }
            }

            let update = false;
            try {
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
              update = true;
            } catch (error) {
              await page.goto(
                conn.instanceUrl +
                  `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`,
                {
                  waitUntil: 'networkidle0'
                }
              );
            } finally {
              this.ux.setSpinnerStatus((update ? 'update ' : 'create ') + stateName + '/' + stateintVal);

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
        }
      } else {
        throw Error('Expected --category= to be one of: ' + Object.keys(jsonParsed).toString());
      }
    } catch (error) {
      this.ux.stopSpinner('error');
      throw error;
    } finally {
      await browser.close();
    }

    return {};
  }
}
