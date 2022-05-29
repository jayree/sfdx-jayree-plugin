"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
const core_1 = require("@salesforce/core");
const internal_1 = require("@salesforce/core/lib/util/internal");
const listr2_1 = require("listr2");
const kit = __importStar(require("@salesforce/kit"));
const config_1 = __importDefault(require("../../../../utils/config"));
const configuretasks_1 = require("../../../../utils/puppeteer/configuretasks");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfdx-jayree', 'configure');
const logger = new listr2_1.Logger({ useIcons: false });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:org:configure');
class ConfigureOrg extends command_1.SfdxCommand {
    async run() {
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        await this.org.refreshAuth();
        const configPath = await internal_1.traverse.forFile(process.cwd(), '.sfdx-jayree.json');
        let allTasks = [];
        let selectedSetupTasks = [];
        if (this.flags.tasks) {
            this.flags.tasks.forEach((task) => {
                selectedSetupTasks = selectedSetupTasks.concat((0, config_1.default)(configPath).setupTasks.filter((t) => task === t.title));
            });
            allTasks = selectedSetupTasks;
        }
        else {
            selectedSetupTasks = (0, config_1.default)(configPath).setupTasks.filter((t) => t.isactive === true);
            allTasks = (0, config_1.default)(configPath).setupTasks;
        }
        const setupTaskRunner = new configuretasks_1.PuppeteerConfigureTasks({
            accessToken: this.org.getConnection().accessToken,
            instanceUrl: this.org.getConnection().instanceUrl,
        }, selectedSetupTasks);
        const setupTasks = new listr2_1.Listr([], { concurrent: this.flags.concurrent, exitOnError: false });
        allTasks.forEach((el) => {
            setupTasks.add({
                title: el.title,
                skip: () => !selectedSetupTasks.includes(el),
                task: async (ctx, task) => {
                    const sTask = setupTaskRunner.getNext();
                    if (!(await sTask.execute(task))) {
                        task.skip();
                    }
                },
                options: { persistentOutput: false, bottomBar: 5 },
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
            return { ...e };
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
ConfigureOrg.requiresProject = false;
//# sourceMappingURL=index.js.map