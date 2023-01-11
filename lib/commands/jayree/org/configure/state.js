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
import { Logger, Listr } from 'listr2';
import kit from '@salesforce/kit';
import Enquirer from 'enquirer';
import Debug from 'debug';
import { MyDefaultRenderer } from '../../../../utils/renderer.js';
import { PuppeteerStateTasks } from '../../../../utils/puppeteer/statetasks.js';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'createstatecountry');
const logger = new Logger({ useIcons: false });
const debug = Debug('jayree:x:y');
export default class ImportState extends SfdxCommand {
    async run() {
        await this.org.refreshAuth();
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        const taskRunner = new PuppeteerStateTasks({
            accessToken: this.org.getConnection().accessToken,
            instanceUrl: this.org.getConnection().instanceUrl,
        });
        const mainTasks = new Listr([
            {
                title: 'Open Browser',
                task: async () => {
                    await taskRunner.open();
                },
            },
            {
                title: 'Get ISO 3166 Data',
                task: async (ctx, task) => {
                    ctx.CountryCode = await taskRunner.validateParameterCountryCode(this.flags.countrycode);
                    ctx.category = taskRunner.validateParameterCategory(this.flags.category);
                    ctx.language = taskRunner.validateParameterLanguage(this.flags.language);
                    debug(ctx);
                    return task.newListr([
                        {
                            title: 'Country Code: ',
                            enabled: () => this.isOutputEnabled && process.stdout.isTTY,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.CountryCode.selected === undefined) {
                                    ctx.CountryCode.selected = await task.prompt({
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
                            enabled: () => this.isOutputEnabled && process.stdout.isTTY,
                            skip: () => !ctx.category.values.length,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.category.selected === undefined) {
                                    ctx.category.selected = await task.prompt({
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
                            enabled: () => this.isOutputEnabled && process.stdout.isTTY,
                            skip: () => !ctx.category.values.length || !ctx.language.values.length,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                if (ctx.language.selected === undefined) {
                                    ctx.language.selected = await task.prompt({
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
                skip: (ctx) => !ctx.category.values.length || !ctx.language.values.length,
                task: async (ctx) => {
                    try {
                        ctx.data = await taskRunner.getData2();
                        ctx.result = [];
                    }
                    catch (error) {
                        ctx.error = error.message;
                        throw error;
                    }
                },
            },
            {
                title: 'Set Country Integration Value: ',
                enabled: (ctx) => (ctx.data ? true : false),
                task: async (ctx, task) => {
                    task.title = task.title + ctx.CountryCode.selected;
                    if (!(await taskRunner.setCountryIntegrationValue())) {
                        task.skip();
                    }
                },
            },
            {
                title: 'Deactivate/Hide States',
                enabled: (ctx) => (ctx.data?.deactivate ? ctx.data.deactivate.length > 0 : false),
                task: (ctx, task) => task.newListr(() => {
                    const deactivateTasks = [];
                    ctx.data.deactivate.forEach((el) => {
                        deactivateTasks.push({
                            title: el.toString(),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            skip: (ctx) => !ctx.data.deactivate.includes(el),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
                                const sTask = taskRunner.getNextDeactivate();
                                if (!(await sTask.executeDeactivate())) {
                                    task.skip();
                                    ctx.result.push({ '3166-2 code': el, status: 'skipped (deactivated)' });
                                }
                                else {
                                    ctx.result.push({ '3166-2 code': el, status: 'updated (deactivated)' });
                                }
                            },
                            options: { persistentOutput: true },
                        });
                    });
                    return deactivateTasks;
                }, { concurrent: this.flags.concurrent, exitOnError: false }),
            },
            {
                title: 'Add States',
                enabled: (ctx) => (ctx.data?.add ? ctx.data.add.length > 0 : false),
                task: (ctx, task) => task.newListr(() => {
                    const addTasks = [];
                    ctx.data.add.forEach((el) => {
                        addTasks.push({
                            title: `${el['Subdivision name']} (${el['3166-2 code']})`,
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            skip: (ctx) => !ctx.data.add.includes(el),
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            task: async (ctx, task) => {
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
                }, { concurrent: this.flags.concurrent, exitOnError: false }),
            },
            {
                title: 'Close Browser',
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                task: async (ctx) => {
                    await taskRunner.close();
                },
            },
        ], {
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
            injectWrapper: { enquirer: new Enquirer() },
        });
        try {
            const context = await mainTasks.run();
            if (context.error) {
                throw new Error(context.error);
            }
            context.result = context.result?.sort((a, b) => a['3166-2 code'] < b['3166-2 code'] ? -1 : a['3166-2 code'] > b['3166-2 code'] ? 1 : 0);
            if (debug.enabled) {
                if (this.isOutputEnabled) {
                    logger.success(`Context: ${JSON.stringify(context, null, 2)}`);
                }
                return context;
            }
            return context.result;
        }
        catch (e) {
            if (debug.enabled) {
                if (this.isOutputEnabled) {
                    logger.fail(e);
                }
            }
            throw e;
        }
    }
}
ImportState.description = messages.getMessage('commandStateDescription');
ImportState.flagsConfig = {
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
ImportState.requiresUsername = true;
ImportState.supportsDevhubUsername = false;
ImportState.requiresProject = false;
//# sourceMappingURL=state.js.map