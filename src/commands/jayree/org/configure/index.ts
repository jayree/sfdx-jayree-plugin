/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { traverse } from '@salesforce/core/lib/util/internal.js';
import { AnyJson } from '@salesforce/ts-types';
import { ListrLogger, Listr, PRESET_TIMER } from 'listr2';
import kit from '@salesforce/kit';
import Debug from 'debug';
import config from '../../../../utils/config.js';
import { PuppeteerConfigureTasks } from '../../../../utils/puppeteer/configuretasks.js';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'configure');

const logger = new ListrLogger({ useIcons: false });

const debug = Debug('jayree:org:configure');

export default class ConfigureOrg extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:org:configure
$ sfdx jayree:org:configure -u me@my.org
$ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
$ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"`,
  ];

  protected static flagsConfig = {
    tasks: flags.array({
      char: 't',
      description: messages.getMessage('tasks'),
    }),
    concurrent: flags.boolean({
      description: messages.getMessage('concurrent'),
      default: false,
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  private isOutputEnabled;

  public async run(): Promise<AnyJson> {
    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);

    await this.org.refreshAuth();
    const configPath = await traverse.forFile(process.cwd(), '.sfdx-jayree.json');

    let allTasks = [];
    let selectedSetupTasks = [];
    if (this.flags.tasks) {
      this.flags.tasks.forEach((task) => {
        selectedSetupTasks = selectedSetupTasks.concat(config(configPath).setupTasks.filter((t) => task === t.title));
      });
      allTasks = selectedSetupTasks;
    } else {
      selectedSetupTasks = config(configPath).setupTasks.filter((t) => t.isactive === true);
      allTasks = config(configPath).setupTasks;
    }

    const setupTaskRunner = new PuppeteerConfigureTasks(
      {
        accessToken: this.org.getConnection().accessToken,
        instanceUrl: this.org.getConnection().instanceUrl,
      },
      selectedSetupTasks
    );

    const setupTasks = new Listr<any>([], { concurrent: this.flags.concurrent, exitOnError: false });

    allTasks.forEach((el) => {
      setupTasks.add({
        title: el.title,
        skip: (): boolean => !selectedSetupTasks.includes(el),
        task: async (ctx, task): Promise<void> => {
          const sTask = setupTaskRunner.getNext();
          if (!(await sTask.execute(task))) {
            task.skip();
          }
        },
        options: { persistentOutput: false, bottomBar: 5 },
      });
    });

    const mainTasks = new Listr<any>(
      [
        {
          title: 'Open Browser',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: async (): Promise<void> => {
            await setupTaskRunner.open();
          },
        },
        {
          title: 'Execute SetupTasks',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: (): Listr => setupTasks,
        },
        {
          title: 'Close Browser',
          skip: (): boolean => !(selectedSetupTasks.length > 0),
          task: async (): Promise<void> => {
            await setupTaskRunner.close();
          },
        },
      ],
      {
        rendererOptions: {
          timer: {
            ...PRESET_TIMER,
            condition: (duration): boolean => duration > 250,
          },
          collapseErrors: false,
          collapseSubtasks: false,
        },
        silentRendererCondition: !this.isOutputEnabled,
        fallbackRendererCondition: debug.enabled,
        exitOnError: false,
      }
    );

    try {
      const context = await mainTasks.run();
      if (debug.enabled) {
        if (this.isOutputEnabled) {
          logger.toStderr(`Context: ${JSON.stringify(context, null, 2)}`);
        }
        return context as unknown as AnyJson;
      }
      return {
        context,
      };
    } catch (e) {
      if (this.isOutputEnabled) {
        logger.toStderr(e);
      }
      return { ...e };
    }
  }
}
