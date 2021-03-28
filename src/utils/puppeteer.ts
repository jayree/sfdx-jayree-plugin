/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import puppeteer from 'puppeteer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:org:configure');

export class PuppeteerTasks {
  public currenTask;
  private tasks: any;
  private nextTaskIndex = -1;
  private browser;
  private auth;

  public constructor(auth, tasks: string[]) {
    this.tasks = tasks;
    this.auth = auth;
  }

  // eslint-disable-next-line complexity
  public async execute(): Promise<boolean> {
    const task = this.currenTask;
    if (!this.browser) {
      await this.open();
    }
    const page = await this.browser.newPage();
    await page.goto(this.auth.instanceUrl + task.url, {
      waitUntil: 'networkidle0',
      timeout: 300000,
    });
    if (task.iframe) {
      await page.waitForSelector('iframe', { timeout: 300000, visible: true });
      await page.goto((await page.frames())[task.iframe].url(), {
        waitUntil: 'networkidle0',
        timeout: 300000,
      });
    }

    for (const call of task.evaluate) {
      if (call.action === 'click') {
        try {
          if (typeof call.waitFor === 'string') {
            if (call.waitFor === 'Navigation') {
              // Nothing to do
            } else if (call.waitFor !== '') {
              const value = await page.evaluate((c) => {
                const element = document.querySelector(c.waitFor);
                return Boolean(
                  element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
                );
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
            const state = await page.evaluate((c) => {
              return {
                checked: document.querySelector(c.querySelector).checked,
                disabled: document.querySelector(c.querySelector).disabled,
              };
            }, call);

            debug(state);

            if (state.checked === call.type.checkbox.checked) {
              debug(`checked already ${call.type.checkbox.checked}`);
              return false;
            } else if (state.disabled) {
              throw new Error('checkbox disabled');
            } else {
              await page.evaluate((c) => {
                document.querySelector(c.querySelector).click();
              }, call);
            }
          }

          if (typeof call.type === 'object' && call.type.list) {
            await page.waitForSelector('table', {
              timeout: 300000,
              visible: true,
            });
            const found = await page.evaluate((c) => {
              const elements = document.querySelectorAll(c.querySelectorAll);
              elements.forEach((element) => {
                if (element.textContent.trim() === c.type.list.selection) {
                  element.click();
                  return element.textContent.trim();
                }
              });
              debug('not found');
              return false;
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
            } else {
              debug('button not found');
              return false;
            }
          }

          if (typeof call.type === 'string' && call.type === 'lightningbutton') {
            const myCanvas = await page.$(call.querySelector);
            if (myCanvas) {
              const myCanvasBox = await myCanvas.boundingBox();
              await page.mouse.click(myCanvasBox.x + myCanvasBox.width / 2, myCanvasBox.y + myCanvasBox.height / 2);
            } else {
              debug('button not found');
              return false;
            }
          }
        } catch (error) {
          throw new Error(error.message);
        }
      }

      if (call.action === 'type') {
        if (typeof call.value === 'string') {
          await page.evaluate((c) => {
            const element = document.querySelector(c.querySelector);
            element.value = c.value;
          }, call);
        }
      }

      if (typeof call.waitFor === 'string') {
        if (call.waitFor === 'Navigation') {
          await page.waitForNavigation({
            waitUntil: 'networkidle0',
            timeout: 300000,
          });
        } else if (call.waitFor !== '') {
          await page.waitForSelector(call.waitFor, {
            visible: true,
            timeout: 300000,
          });
        }
      }

      if (Array.isArray(call.waitFor)) {
        if (call.waitFor[0] === 'not') {
          /* eslint no-constant-condition: ["error", { "checkLoops": false }] */
          while (true) {
            try {
              await page.waitForFunction((selector) => !document.querySelector(selector), {}, call.waitFor[1]);
              break;
            } catch {
              await page.reload({
                waitUntil: 'networkidle0',
              });
              continue;
            }
          }
        } else {
          await page.waitForSelector(call.waitFor[1], {
            visible: true,
            timeout: 300000,
          });
        }
      }

      if (typeof call.waitFor === 'object') {
        if (typeof call.waitFor.querySelector === 'string') {
          if (typeof call.waitFor.property !== 'undefined') {
            await page.waitForFunction(
              (c) => {
                let value = document.querySelector(c.waitFor.querySelector);
                if (value !== null) {
                  value = value[c.waitFor.property].trim();
                  return value.includes(c.waitFor.value);
                }
                return false;
              },
              {
                timeout: 300000,
              },
              call
            );
          }
        }
      }
    }
    return true;
  }

  public getNext() {
    this.nextTaskIndex = this.nextTaskIndex + 1;
    this.currenTask = this.tasks[this.nextTaskIndex];
    return this;
  }

  public async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  public async open() {
    if (!this.browser) {
      if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
        this.browser = await puppeteer.launch({
          executablePath: '/usr/bin/chromium-browser',
          args: ['--disable-dev-shm-usage'],
        });
      } else {
        this.browser = await puppeteer.launch({ headless: true });
      }

      const login = await this.browser.newPage();
      await login.goto(`${this.auth.instanceUrl}/secur/frontdoor.jsp?sid=${this.auth.accessToken}`, {
        waitUntil: 'networkidle0',
        timeout: 300000,
      });
    }
  }
}
