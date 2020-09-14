"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const listr2_1 = require("listr2");
const kit = tslib_1.__importStar(require("@salesforce/kit"));
const config_1 = tslib_1.__importDefault(require("../../../utils/config"));
const puppeteer_1 = require("../../../utils/puppeteer");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'configure');
const logger = new listr2_1.Logger({ useIcons: false });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:org:configure');
class ConfigureOrg extends command_1.SfdxCommand {
    async run() {
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        await this.org.refreshAuth();
        let selectedSetupTasks;
        if (this.flags.tasks) {
            selectedSetupTasks = config_1.default(this.project.getPath()).setupTasks.filter((t) => this.flags.tasks.includes(t.title));
        }
        else {
            selectedSetupTasks = config_1.default(this.project.getPath()).setupTasks.filter((t) => t.isactive === true);
        }
        const setupTaskRunner = new puppeteer_1.PuppeteerTasks({
            accessToken: this.org.getConnection().accessToken,
            instanceUrl: this.org.getConnection().instanceUrl,
        }, selectedSetupTasks);
        const setupTasks = new listr2_1.Listr([], { concurrent: this.flags.concurrent, exitOnError: false });
        config_1.default(this.project.getPath()).setupTasks.forEach((el) => {
            setupTasks.add({
                title: el.title,
                skip: () => !selectedSetupTasks.includes(el),
                task: async (ctx, task) => {
                    const sTask = setupTaskRunner.getNext();
                    if (!(await sTask.execute())) {
                        task.output = 'already done';
                    }
                },
                options: { persistentOutput: true },
            });
        });
        const mainTasks = new listr2_1.Listr([
            {
                title: 'Open Browser',
                skip: () => !(selectedSetupTasks.length > 0),
                task: async () => {
                    await setupTaskRunner.open();
                },
            },
            {
                title: 'Execute SetupTasks',
                skip: () => !(selectedSetupTasks.length > 0),
                task: () => setupTasks,
            },
            {
                title: 'Close Browser',
                skip: () => !(selectedSetupTasks.length > 0),
                task: async () => {
                    await setupTaskRunner.close();
                },
            },
        ], {
            rendererOptions: { showTimer: true, collapseErrors: false, collapse: false },
            rendererSilent: !this.isOutputEnabled,
            rendererFallback: debug.enabled,
            exitOnError: false,
        });
        try {
            const context = await mainTasks.run();
            if (debug.enabled) {
                if (this.isOutputEnabled) {
                    logger.success(`Context: ${JSON.stringify(context, null, 2)}`);
                }
                return context;
            }
            return {
                context,
            };
        }
        catch (e) {
            if (this.isOutputEnabled) {
                logger.fail(e);
            }
            return Object.assign({}, e);
        }
    }
}
exports.default = ConfigureOrg;
ConfigureOrg.description = messages.getMessage('commandDescription');
ConfigureOrg.examples = [
    `$ sfdx jayree:org:configure
$ sfdx jayree:org:configure -u me@my.org
$ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
$ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"`,
];
ConfigureOrg.flagsConfig = {
    tasks: command_1.flags.array({
        char: 't',
        description: messages.getMessage('tasks'),
    }),
    concurrent: command_1.flags.boolean({
        description: messages.getMessage('concurrent'),
        default: false,
    }),
};
ConfigureOrg.requiresUsername = true;
ConfigureOrg.supportsDevhubUsername = false;
ConfigureOrg.requiresProject = true;
//# sourceMappingURL=configure.js.map