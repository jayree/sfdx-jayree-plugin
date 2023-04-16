/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import playwright from 'playwright-chromium';
import chalk from 'chalk';
import Debug from 'debug';
import config from '../config.js';
const debug = Debug('jayree:org:configure');
export class PuppeteerConfigureTasks {
    constructor(auth, tasks) {
        this.nextTaskIndex = -1;
        this.tasks = tasks;
        this.auth = auth;
    }
    // eslint-disable-next-line complexity
    static async subExec(page, task) {
        for await (const call of task.evaluate) {
            if (call.action === 'click') {
                try {
                    if (typeof call.waitFor === 'string') {
                        if (call.waitFor === 'Navigation') {
                            // Nothing to do
                        }
                        else if (call.waitFor !== '') {
                            const value = await page.evaluate((c) => {
                                const element = document.querySelector(c.waitFor);
                                return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
                            }, call);
                            if (value === true) {
                                debug(`checked already ${call.type.checkbox.checked}`);
                                return false;
                            }
                        }
                    }
                    if (typeof call.waitFor === 'object') {
                        if (typeof call.waitFor.querySelector === 'string') {
                            let value;
                            if (typeof call.waitFor.property !== 'undefined') {
                                value = await page.evaluate((c) => {
                                    // eslint-disable-next-line no-underscore-dangle
                                    let value_ = document.querySelector(c.waitFor.querySelector);
                                    if (value_ !== null) {
                                        value_ = value_[c.waitFor.property].trim();
                                        return value_.includes(c.waitFor.value);
                                    }
                                    return false;
                                }, call);
                            }
                            if (value === true) {
                                debug('already done');
                                return false;
                            }
                        }
                    }
                    if (typeof call.type === 'object' && call.type.checkbox) {
                        const state = await page.evaluate((c) => ({
                            checked: document.querySelector(c.querySelector).checked,
                            disabled: document.querySelector(c.querySelector).disabled,
                        }), call);
                        debug(state);
                        if (state.checked === call.type.checkbox.checked) {
                            debug(`checked already ${call.type.checkbox.checked}`);
                            return false;
                        }
                        else if (state.disabled) {
                            throw new Error('checkbox disabled');
                        }
                        else {
                            await page.evaluate((c) => {
                                document.querySelector(c.querySelector).click();
                            }, call);
                        }
                    }
                    if (typeof call.type === 'object' && call.type.list) {
                        await page.waitForSelector('table', {
                            timeout: 300000,
                            state: 'visible',
                        });
                        debug({
                            [call.querySelectorAll]: await page.evaluate((c) => {
                                const elements = document.querySelectorAll(c.querySelectorAll);
                                const ret = [];
                                elements.forEach((element) => {
                                    ret.push(element.textContent.trim());
                                });
                                return ret;
                            }, call),
                        });
                        const found = await page.evaluate((c) => {
                            const elements = document.querySelectorAll(c.querySelectorAll);
                            let ret = '';
                            elements.forEach((element) => {
                                if (element.textContent.trim() === c.type.list.selection) {
                                    element.click();
                                    ret = element.textContent.trim();
                                }
                            });
                            return ret;
                        }, call);
                        if (found !== call.type.list.selection) {
                            debug(`value ${call.type.list.selection} not found`);
                            return false;
                        }
                    }
                    if (typeof call.type === 'string' && call.type === 'button') {
                        if (await page.$(call.querySelector)) {
                            await page.evaluate((c) => {
                                document.querySelector(c.querySelector).click();
                            }, call);
                        }
                        else {
                            debug('button not found');
                            return false;
                        }
                    }
                    if (typeof call.type === 'string' && call.type === 'lightningbutton') {
                        const myCanvas = await page.$(call.querySelector);
                        if (myCanvas) {
                            const myCanvasBox = await myCanvas.boundingBox();
                            await page.mouse.click(myCanvasBox.x + myCanvasBox.width / 2, myCanvasBox.y + myCanvasBox.height / 2);
                        }
                        else {
                            debug('button not found');
                            return false;
                        }
                    }
                }
                catch (error) {
                    throw new Error(error.message);
                }
            }
            if (call.action === 'type') {
                if (typeof call.value === 'string') {
                    const value = await page.evaluate((c) => {
                        const element = document.querySelector(c.querySelector);
                        return element.value;
                    }, call);
                    if (value === call.value) {
                        debug(`value already ${call.value}`);
                        return false;
                    }
                    else {
                        await page.evaluate((c) => {
                            const element = document.querySelector(c.querySelector);
                            element.value = c.value;
                        }, call);
                    }
                }
            }
            if (typeof call.waitFor === 'string') {
                if (call.waitFor === 'Navigation') {
                    await page.waitForNavigation({
                        waitUntil: 'networkidle',
                        timeout: 300000,
                    });
                }
                else if (call.waitFor !== '') {
                    await page.waitForSelector(call.waitFor, {
                        state: 'visible',
                        timeout: 300000,
                    });
                }
            }
            if (Array.isArray(call.waitFor)) {
                if (call.waitFor[0] === 'not') {
                    /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
                    while (true) {
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            await page.waitForSelector(call.waitFor[1], { state: 'hidden' });
                            break;
                        }
                        catch (e) {
                            debug(e.message);
                            // eslint-disable-next-line no-await-in-loop
                            await page.reload({
                                waitUntil: 'networkidle',
                            });
                            continue;
                        }
                    }
                }
                else {
                    await page.waitForSelector(call.waitFor[1], {
                        state: 'visible',
                        timeout: 300000,
                    });
                }
            }
            if (typeof call.waitFor === 'object') {
                if (typeof call.waitFor.querySelector === 'string') {
                    if (typeof call.waitFor.property !== 'undefined') {
                        await page.waitForFunction((c) => {
                            let value = document.querySelector(c.waitFor.querySelector);
                            if (value !== null) {
                                value = value[c.waitFor.property].trim();
                                return value.includes(c.waitFor.value);
                            }
                            return false;
                        }, call, {
                            timeout: 300000,
                        });
                    }
                }
            }
        }
        return true;
    }
    getNext() {
        this.nextTaskIndex = this.nextTaskIndex + 1;
        this.currenTask = this.tasks[this.nextTaskIndex];
        return this;
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async open() {
        if (!this.browser) {
            this.browser = await playwright['chromium'].launch(config().puppeteer);
            this.context = await this.browser.newContext();
            const login = await this.context.newPage();
            await login.goto(`${this.auth.instanceUrl}/secur/frontdoor.jsp?sid=${this.auth.accessToken}`, {
                waitUntil: 'networkidle',
                timeout: 300000,
            });
        }
    }
    async execute(listrTask) {
        const task = this.currenTask;
        if (!this.browser) {
            await this.open();
        }
        if (!task.tasks) {
            task.tasks = [{ evaluate: task.evaluate }];
        }
        let retValue = false;
        for await (const subTask of task.tasks) {
            const page = await this.context.newPage();
            await page.goto(this.auth.instanceUrl + task.url, {
                waitUntil: 'networkidle',
                timeout: 300000,
            });
            if (task.iframe) {
                await page.waitForSelector('iframe', { timeout: 300000, state: 'visible' });
                await page.goto(page.frames()[task.iframe].url(), {
                    waitUntil: 'networkidle',
                    timeout: 300000,
                });
            }
            if ((await PuppeteerConfigureTasks.subExec(page, subTask)) === true) {
                retValue = true;
                if (subTask.title) {
                    listrTask.output = `${subTask.title}`;
                }
            }
            else if (subTask.title) {
                listrTask.output = `${subTask.title} ${chalk.dim('[SKIPPED]')}`;
            }
            debug({ retValue });
        }
        debug({ retValue });
        return retValue;
    }
}
//# sourceMappingURL=configuretasks.js.map