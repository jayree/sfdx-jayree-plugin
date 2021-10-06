"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const listr2_1 = require("listr2");
const kit = (0, tslib_1.__importStar)(require("@salesforce/kit"));
const enquirer_1 = (0, tslib_1.__importDefault)(require("enquirer"));
const renderer_1 = require("../../../../utils/renderer");
const statetasks_1 = require("../../../../utils/puppeteer/statetasks");
const jayreeSfdxCommand_1 = require("../../../../jayreeSfdxCommand");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'createstatecountry');
const logger = new listr2_1.Logger({ useIcons: false });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:x:y');
class ImportState extends jayreeSfdxCommand_1.JayreeSfdxCommand {
    async run() {
        this.warnIfRunByAlias(ImportState.aliases, ImportState.id);
        await this.org.refreshAuth();
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        const taskRunner = new statetasks_1.PuppeteerStateTasks({
            accessToken: this.org.getConnection().accessToken,
            instanceUrl: this.org.getConnection().instanceUrl,
        });
        const mainTasks = new listr2_1.Listr([
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
                enabled: (ctx) => (ctx.data && ctx.data.deactivate ? ctx.data.deactivate.length > 0 : false),
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
                enabled: (ctx) => (ctx.data && ctx.data.add ? ctx.data.add.length > 0 : false),
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
            renderer: renderer_1.MyDefaultRenderer,
            rendererOptions: {
                showTimer: true,
                collapseErrors: false,
                collapse: false,
                maxSubTasks: this.flags.concurrent >= 10 ? this.flags.concurrent : 10,
            },
            rendererSilent: !this.isOutputEnabled,
            rendererFallback: debug.enabled,
            exitOnError: false,
            injectWrapper: { enquirer: new enquirer_1.default() },
        });
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
exports.default = ImportState;
ImportState.aliases = [
    'jayree:automation:statecountry:import',
    'jayree:automation:statecountry:create',
    'jayree:automation:statecountry:update',
    'jayree:automation:state:import',
];
ImportState.description = messages.getMessage('commandStateDescription');
ImportState.flagsConfig = {
    countrycode: command_1.flags.string({
        description: messages.getMessage('countrycodeFlagDescription'),
    }),
    category: command_1.flags.string({
        description: messages.getMessage('categoryFlagDescription'),
    }),
    language: command_1.flags.string({
        description: messages.getMessage('languageFlagDescription'),
    }),
    concurrent: command_1.flags.integer({
        description: 'ccc',
        default: 1,
    }),
};
ImportState.requiresUsername = true;
ImportState.supportsDevhubUsername = false;
ImportState.requiresProject = false;
//# sourceMappingURL=state.js.map