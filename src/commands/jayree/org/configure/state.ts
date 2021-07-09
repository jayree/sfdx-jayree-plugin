/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { Logger, Listr } from 'listr2';
import * as kit from '@salesforce/kit';
import Enquirer from 'enquirer';
import { MyDefaultRenderer } from '../../../../utils/renderer';
import { PuppeteerStateTasks } from '../../../../utils/puppeteer/statetasks';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'createstatecountry');

const logger = new Logger({ useIcons: false });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:x:y');

export default class ImportState extends JayreeSfdxCommand {
  public static aliases = [
    'jayree:automation:statecountry:import',
    'jayree:automation:statecountry:create',
    'jayree:automation:statecountry:update',
    'jayree:automation:state:import',
  ];

  public static description = messages.getMessage('commandStateDescription');

  protected static flagsConfig = {
    countrycode: flags.string({
      description: messages.getMessage('countrycodeFlagDescription'),
    }),
    category: flags.string({
      description: messages.getMessage('categoryFlagDescription'),
    }),
    language: flags.string({
      description: messages.getMessage('languageFlagDescription'),
    }),
    concurrent: flags.integer({
      description: 'ccc',
      default: 1,
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  private isOutputEnabled;

  public async run(): Promise<AnyJson> {
    this.warnIfRunByAlias(ImportState);
    await this.org.refreshAuth();

    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);

    const taskRunner = new PuppeteerStateTasks({
      accessToken: this.org.getConnection().accessToken,
      instanceUrl: this.org.getConnection().instanceUrl,
    });

    const mainTasks = new Listr(
      [
        {
          title: 'Open Browser',
          task: async (): Promise<void> => {
            await taskRunner.open();
          },
        },
        {
          title: 'Get ISO 3166 Data',
          task: async (ctx, task): Promise<Listr> => {
            ctx.CountryCode = await taskRunner.validateParameterCountryCode(this.flags.countrycode);
            ctx.category = taskRunner.validateParameterCategory(this.flags.category);
            ctx.language = taskRunner.validateParameterLanguage(this.flags.language);
            debug(ctx);
            return task.newListr([
              {
                title: 'Country Code: ',
                enabled: (): boolean => this.isOutputEnabled && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx, task): Promise<void> => {
                  if (ctx.CountryCode.selected === undefined) {
                    ctx.CountryCode.selected = await task.prompt<boolean>({
                      type: 'AutoComplete',
                      message: 'Select Country',
                      choices: ctx.CountryCode.values,
                    });
                    ctx.CountryCode = await taskRunner.validateParameterCountryCode(ctx.CountryCode.selected);
                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected);
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                  }
                  debug(ctx);
                  task.title = task.title + ctx.CountryCode.selected;
                },
              },
              {
                title: 'Category: ',
                enabled: (): boolean => this.isOutputEnabled && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx, task): Promise<void> => {
                  if (ctx.category.selected === undefined) {
                    ctx.category.selected = await task.prompt<boolean>({
                      type: 'Select',
                      message: 'Select Category',
                      choices: ctx.category.values,
                    });
                    ctx.category = taskRunner.validateParameterCategory(ctx.category.selected);
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                  }
                  debug(ctx);
                  task.title = task.title + ctx.category.selected;
                },
              },
              {
                title: 'Language: ',
                enabled: (): boolean => this.isOutputEnabled && process.stdout.isTTY,
                // eslint-disable-next-line @typescript-eslint/no-shadow
                task: async (ctx, task): Promise<void> => {
                  if (ctx.language.selected === undefined) {
                    ctx.language.selected = await task.prompt<boolean>({
                      type: 'Select',
                      message: 'Select Language',
                      choices: ctx.language.values,
                    });
                    ctx.language = taskRunner.validateParameterLanguage(ctx.language.selected);
                  }
                  debug(ctx);
                  task.title = task.title + ctx.language.selected;
                },
              },
            ]);
          },
        },
        {
          task: async (ctx): Promise<void> => {
            try {
              ctx.data = await taskRunner.getData2();
              ctx.result = [];
            } catch (error) {
              ctx.error = error.message;
              throw error;
            }
          },
        },
        {
          title: 'Set Country Integration Value: ',
          enabled: (ctx): boolean => (ctx.data ? true : false),
          task: async (ctx, task): Promise<void> => {
            task.title = task.title + ctx.CountryCode.selected;
            if (!(await taskRunner.setCountryIntegrationValue())) {
              task.skip();
            }
          },
        },
        {
          title: 'Deactivate/Hide States',
          enabled: (ctx): boolean => (ctx.data && ctx.data.deactivate ? ctx.data.deactivate.length > 0 : false),
          task: (ctx, task): Listr =>
            task.newListr(
              () => {
                const deactivateTasks = [];
                ctx.data.deactivate.forEach((el) => {
                  deactivateTasks.push({
                    title: el.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    skip: (ctx): boolean => !ctx.data.deactivate.includes(el),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    task: async (ctx, task): Promise<void> => {
                      const sTask = taskRunner.getNextDeactivate();
                      if (!(await sTask.executeDeactivate())) {
                        task.skip();
                        ctx.result.push({ '3166-2 code': el, status: 'skipped (deactivated)' });
                      } else {
                        ctx.result.push({ '3166-2 code': el, status: 'updated (deactivated)' });
                      }
                    },
                    options: { persistentOutput: true },
                  });
                });
                return deactivateTasks;
              },
              { concurrent: this.flags.concurrent, exitOnError: false }
            ),
        },
        {
          title: 'Add States',
          enabled: (ctx): boolean => (ctx.data && ctx.data.add ? ctx.data.add.length > 0 : false),
          task: (ctx, task): Listr =>
            task.newListr(
              () => {
                const addTasks = [];
                ctx.data.add.forEach((el) => {
                  addTasks.push({
                    title: `${el['Subdivision name']} (${el['3166-2 code']})`,
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    skip: (ctx): boolean => !ctx.data.add.includes(el),
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    task: async (ctx, task): Promise<void> => {
                      const sTask = taskRunner.getNextAdd();
                      const result = await sTask.executeAdd();
                      ctx.result.push({ ...el, status: result });
                      if (result === 'skipped') {
                        task.skip();
                      }
                    },
                    options: { persistentOutput: true },
                  });
                });
                return addTasks;
              },
              { concurrent: this.flags.concurrent, exitOnError: false }
            ),
        },
        {
          title: 'Close Browser',
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          task: async (ctx): Promise<void> => {
            await taskRunner.close();
          },
        },
      ],
      {
        renderer: MyDefaultRenderer,
        rendererOptions: {
          showTimer: true,
          collapseErrors: false,
          collapse: false,
          maxSubTasks: this.flags.concurrent >= 10 ? this.flags.concurrent : 10,
        },
        rendererSilent: !this.isOutputEnabled,
        rendererFallback: debug.enabled,
        exitOnError: false,
        injectWrapper: { enquirer: new Enquirer() as any },
      }
    );

    try {
      const context = await mainTasks.run();
      if (context.error) {
        throw new Error(context.error);
      }

      context.result = context.result.sort(function (a, b) {
        return a['3166-2 code'] < b['3166-2 code'] ? -1 : a['3166-2 code'] > b['3166-2 code'] ? 1 : 0;
      });

      if (debug.enabled) {
        if (this.isOutputEnabled) {
          logger.success(`Context: ${JSON.stringify(context, null, 2)}`);
        }
        return context;
      }
      return context.result;
    } catch (e) {
      if (debug.enabled) {
        if (this.isOutputEnabled) {
          logger.fail(e);
        }
      }
      throw e;
    }
  }
}
