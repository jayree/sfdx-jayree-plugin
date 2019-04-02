import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import puppeteer = require('puppeteer');
import tabletojson = require('tabletojson');

if (Symbol['asyncIterator'] === undefined) {
  // tslint:disable-next-line:no-any
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-jayree', 'createstatecountry');

export default class CreateStateCountry extends SfdxCommand {
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
    update: flags.boolean({
      description: messages.getMessage('updateFlagDescription'),
      required: false,
      default: false
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

        for await (const value of jsonParsed[this.flags.category.toLowerCase()]) {
          const language = value['Language code'];
          if (this.flags.language.toLowerCase() === language) {
            const countrycode = value['3166-2 code'].split('-')[0];
            const stateintVal = value['3166-2 code'].split('*')[0];
            const stateIsoCode = value['3166-2 code'].split('-')[1].split('*')[0];
            const stateName =
              this.flags.uselocalvariant && value['Local variant'] !== ''
                ? value['Local variant']
                : value['Subdivision name'];

            this.ux.setSpinnerStatus((this.flags.update ? 'update ' : 'create ') + stateName + '/' + stateintVal);

            const setupurl = this.flags.update
              ? `i18n/ConfigureState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview&stateIso=${stateIsoCode}`
              : `/i18n/ConfigureNewState.apexp?countryIso=${countrycode}&setupid=AddressCleanerOverview`;

            await page.goto(conn.instanceUrl + setupurl, {
              waitUntil: 'networkidle2'
            });

            await page.evaluate(
              val =>
                ((document.querySelector(
                  '#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a nameSectionItem\\3a editName'
                ) as HTMLInputElement).value = val),
              stateName
            );

            await page.evaluate(
              val =>
                ((document.querySelector(
                  '#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a codeSectionItem\\3a editIsoCode'
                ) as HTMLInputElement).value = val),
              stateIsoCode
            );

            await page.evaluate(
              val =>
                ((document.querySelector(
                  '#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a intValSectionItem\\3a editIntVal'
                ) as HTMLInputElement).value = val),
              stateintVal
            );

            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a activeSectionItem\\3a editActive');

            await page.waitFor(
              () => {
                const val = document.querySelector(
                  '#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a visibleSectionItem\\3a editVisible'
                )['disabled'];
                return (val as boolean) === false;
              },
              {
                timeout: 0
              }
            );

            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id9\\3a visibleSectionItem\\3a editVisible');
            await page.click('#configurenew\\3a j_id1\\3a blockNew\\3a j_id43\\3a addButton');
            await page.waitForNavigation({
              waitUntil: 'networkidle0',
              timeout: 0
            });
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
