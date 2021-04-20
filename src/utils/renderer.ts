/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import cliTruncate from 'cli-truncate';
import figures from 'figures';
import indentString from 'indent-string';
import logUpdate from 'log-update';

import { ListrContext, ListrRenderer, ListrTaskObject } from 'listr2';
import chalk from 'chalk';

import timeSpan from 'time-span';

/** Default updating renderer for Listr2 */
export class MyDefaultRenderer implements ListrRenderer {
  /** designates whether this renderer can output to a non-tty console */
  public static nonTTY = false;
  /** renderer options for the defauult renderer */
  public static rendererOptions: {
    /**
     * indentation per level of subtask
     *
     * @default 2
     */
    indentation?: number;
    /**
     * clear output when task finishes
     *
     * @default false
     */
    clearOutput?: boolean;
    /**
     * show the subtasks of the current task if it returns a new listr
     *
     * @default true
     */
    showSubtasks?: boolean;
    /**
     * collapse subtasks after finish
     *
     * @default true
     */
    collapse?: boolean;
    /**
     * collapse skip messages in to single message and override the task title
     *
     * @default true
     */
    collapseSkips?: boolean;
    /**
     * show skip messages or show the original title of the task, this will also disable collapseSkips mode
     *
     * You can disable showing the skip messages, eventhough you passed in a message by settings this option,
     * if you want to keep the original task title intacted.
     *
     * @default true
     */
    showSkipMessage?: boolean;
    /**
     * suffix skip messages with [SKIPPED] when in collapseSkips mode
     *
     * @default true
     */
    suffixSkips?: boolean;
    /**
     * collapse error messages in to single message in task title
     *
     * @default true
     */
    collapseErrors?: boolean;
    /**
     * shows the thrown error message or show the original title of the task, this will also disable collapseErrors mode
     * You can disable showing the error messages, eventhough you passed in a message by settings this option,
     * if you want to keep the original task title intacted.
     *
     * @default true
     */
    showErrorMessage?: boolean;
    /**
     * only update via renderhook
     *
     * useful for tests and stuff. this will disable showing spinner and only update the screen if the something else has
     * happened in the task worthy to show
     *
     * @default false
     */
    lazy?: boolean;
    /**
     * show duration for all tasks
     *
     * overwrites per task renderer options
     *
     * @default false
     */
    showTimer?: boolean;
    /**
     * max subtasks to print
     *
     * @default 10
     */
    maxSubTasks?: number;
    /**
     * hide subtasks after x seconds
     *
     * @default 10
     */
    hideAfterSeconds?: number;
  } = {
    indentation: 2,
    clearOutput: false,
    showSubtasks: true,
    collapse: true,
    collapseSkips: true,
    showSkipMessage: true,
    suffixSkips: true,
    collapseErrors: true,
    showErrorMessage: true,
    lazy: false,
    showTimer: false,
    maxSubTasks: 10,
    hideAfterSeconds: 5,
  };

  /** per task options for the default renderer */
  public static rendererTaskOptions: {
    /**
     * write task output to bottom bar instead of the gap under the task title itself.
     * useful for stream of data.
     *
     * @default false
     *
     * `true` only keep 1 line of latest data outputted by the task.
     * `false` only keep 1 line of latest data outputted by the task.
     * `number` will keep designated data of latest data outputted by the task.
     */
    bottomBar?: boolean | number;
    /**
     * keep output after task finishes
     *
     * @default false
     *
     * works both for bottom bar and the default behavior
     */
    persistentOutput?: boolean;
    /**
     * show the task time if it was succesful
     */
    showTimer?: boolean;
  };

  private id?: NodeJS.Timeout;
  private bottomBar: { [uuid: string]: { data?: string[]; items?: number } } = {};
  private promptBar: string;
  private spinner: string[] =
    process.platform === 'win32' && !process.env.WT_SESSION
      ? ['-', '\\', '|', '/']
      : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerPosition = 0;

  private taskTime: any = {};
  private currentTasks: any = {};
  private hiddenTasks: any = {};

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(
    public tasks: Array<ListrTaskObject<any, typeof MyDefaultRenderer>>,
    public options: typeof MyDefaultRenderer['rendererOptions'],
    public renderHook$?: ListrTaskObject<any, any>['renderHook$']
  ) {
    this.options = { ...MyDefaultRenderer.rendererOptions, ...this.options };
  }

  public getTaskOptions(
    task: ListrTaskObject<any, typeof MyDefaultRenderer>
  ): typeof MyDefaultRenderer['rendererTaskOptions'] {
    return { ...MyDefaultRenderer.rendererTaskOptions, ...task.rendererTaskOptions };
  }

  public isBottomBar(task: ListrTaskObject<any, typeof MyDefaultRenderer>): boolean {
    const bottomBar = this.getTaskOptions(task).bottomBar;
    return (
      (typeof bottomBar === 'number' && bottomBar !== 0) || (typeof bottomBar === 'boolean' && bottomBar !== false)
    );
  }

  public hasPersistentOutput(task: ListrTaskObject<any, typeof MyDefaultRenderer>): boolean {
    return this.getTaskOptions(task).persistentOutput === true;
  }

  public hasTimer(task: ListrTaskObject<any, typeof MyDefaultRenderer>): boolean {
    return this.getTaskOptions(task).showTimer === true;
  }

  /* istanbul ignore next */
  public getTaskTime(task: ListrTaskObject<any, typeof MyDefaultRenderer>): string {
    const seconds = Math.floor(task.message.duration / 1000);
    const minutes = Math.floor(seconds / 60);

    let parsedTime: string;
    if (seconds === 0 && minutes === 0) {
      parsedTime = `0.${Math.floor(task.message.duration / 100)}s`;
    }

    if (seconds > 0) {
      parsedTime = `${seconds % 60}s`;
    }

    if (minutes > 0) {
      parsedTime = `${minutes}m${parsedTime}`;
    }

    return chalk.dim(`[${parsedTime}]`);
  }

  public createRender(options?: { tasks?: boolean; bottomBar?: boolean; prompt?: boolean }): string {
    options = {
      ...{
        tasks: true,
        bottomBar: true,
        prompt: true,
      },
      ...options,
    };

    const render: string[] = [];

    const renderTasks = this.multiLineRenderer(this.tasks);
    const renderBottomBar = this.renderBottomBar();
    const renderPrompt = this.renderPrompt();

    if (options.tasks && renderTasks?.trim().length > 0) {
      render.push(renderTasks);
    }

    if (options.bottomBar && renderBottomBar?.trim().length > 0) {
      render.push((render.length > 0 ? EOL : '') + renderBottomBar);
    }

    if (options.prompt && renderPrompt?.trim().length > 0) {
      render.push((render.length > 0 ? EOL : '') + renderPrompt);
    }

    return render.length > 0 ? render.join(EOL) : '';
  }

  public render(): void {
    // Do not render if we are already rendering
    if (this.id) {
      return;
    }

    const updateRender = (): void => logUpdate(this.createRender());

    /* istanbul ignore if */
    if (!this.options?.lazy) {
      this.id = setInterval(() => {
        this.spinnerPosition = ++this.spinnerPosition % this.spinner.length;
        updateRender();
      }, 100);
    }

    this.renderHook$.subscribe(() => {
      updateRender();
    });
  }

  public end(): void {
    clearInterval(this.id);
    if (this.id) {
      this.id = undefined;
    }

    // clear log updater
    logUpdate.clear();
    logUpdate.done();

    // directly write to process.stdout, since logupdate only can update the seen height of terminal
    if (!this.options.clearOutput) {
      process.stdout.write(this.createRender({ prompt: false }) + EOL);
    }
  }

  // eslint-disable-next-line
  private multiLineRenderer(tasks: ListrTaskObject<any, typeof MyDefaultRenderer>[], id = 'root', level = 0): string {
    let output: string[] = [];
    if (!this.taskTime[id]) {
      this.taskTime[id] = {};
    }
    if (!this.hiddenTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
      this.hiddenTasks[id] = tasks.filter(
        (t) =>
          level > 0 &&
          typeof this.taskTime[id][t.id] !== 'undefined' &&
          this.taskTime[id][t.id].seconds() > this.options.hideAfterSeconds
      );
    }

    if (!this.currentTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
      this.currentTasks[id] = tasks.filter(
        (t) =>
          level > 0 &&
          (typeof this.taskTime[id][t.id] === 'undefined' ||
            this.taskTime[id][t.id].seconds() <= this.options.hideAfterSeconds)
      );
    }

    if (this.hiddenTasks[id].length > 0 && tasks.filter((t) => t.isPending()).length !== 0) {
      const completed = this.hiddenTasks[id].filter((t) => t.isCompleted());
      if (completed.length > 0) {
        output = [
          ...output,
          this.formatString(`... completed (${completed.length})`, chalk.green(figures.main.tick), level),
        ];
      }
      const failed = this.hiddenTasks[id].filter((t) => t.hasFailed());
      if (failed.length > 0) {
        output = [...output, this.formatString(`... failed (${failed.length})`, chalk.red(figures.main.cross), level)];
      }
      const skipped = this.hiddenTasks[id].filter((t) => t.isSkipped());
      if (skipped.length > 0) {
        output = [
          ...output,
          this.formatString(`... skipped (${skipped.length})`, chalk.yellow(figures.main.arrowDown), level),
        ];
      }
    }

    for (const task of tasks) {
      const idx = this.currentTasks[id].findIndex((x) => x.title === task.title);
      if (
        (idx >= 0 && idx <= this.options.maxSubTasks - 1) ||
        level === 0 ||
        tasks.filter((t) => t.isPending() || typeof t.state === 'undefined').length === 0
      ) {
        if (task.isEnabled()) {
          // Current Task Title
          if (task.hasTitle()) {
            if (
              !(
                tasks.some(
                  // eslint-disable-next-line no-shadow
                  (task) => task.hasFailed()
                ) &&
                !task.hasFailed() &&
                task.options.exitOnError !== false &&
                !(task.isCompleted() || task.isSkipped())
              )
            ) {
              // if task is skipped
              if (task.hasFailed() && this.options.collapseErrors) {
                // current task title and skip change the title
                output = [
                  ...output,
                  this.formatString(
                    task.message.error && this.options.showErrorMessage ? task.message.error : task.title,
                    this.getSymbol(task),
                    level
                  ),
                ];
              } else if (task.isSkipped() && this.options.collapseSkips) {
                // current task title and skip change the title
                output = [
                  ...output,
                  this.formatString(
                    (task.message.skip && this.options.showSkipMessage ? task.message.skip : task.title) +
                      (this.options.suffixSkips ? chalk.dim(' [SKIPPED]') : ''),
                    this.getSymbol(task),
                    level
                  ),
                ];
              } else if (task.isCompleted() && task.hasTitle() && (this.options.showTimer || this.hasTimer(task))) {
                // task with timer
                output = [
                  ...output,
                  this.formatString(`${task?.title} ${this.getTaskTime(task)}`, this.getSymbol(task), level),
                ];
              } else {
                // normal state
                output = [...output, this.formatString(task.title, this.getSymbol(task), level)];
              }
            } else {
              // some sibling task but self has failed and this has stopped
              output = [...output, this.formatString(task.title, chalk.red(figures.main.squareSmallFilled), level)];
            }
          }

          // task should not have subtasks since subtasks will handle the error already
          // maybe it is a better idea to show the error or skip messages when show subtasks is disabled.
          if (!task.hasSubtasks() || !this.options.showSubtasks) {
            // without the collapse option for skip and errors
            if (
              task.hasFailed() &&
              this.options.collapseErrors === false &&
              (this.options.showErrorMessage || !this.options.showSubtasks)
            ) {
              // show skip data if collapsing is not defined
              output = [...output, ...this.dumpData(task, level, 'error')];
            } else if (
              task.isSkipped() &&
              this.options.collapseSkips === false &&
              (this.options.showSkipMessage || !this.options.showSubtasks)
            ) {
              // show skip data if collapsing is not defined
              output = [...output, ...this.dumpData(task, level, 'skip')];
            }
          }

          // Current Task Output
          if (task?.output) {
            if (task.isPending() && task.isPrompt()) {
              // data output to prompt bar if prompt
              this.promptBar = task.output;
            } else if (this.isBottomBar(task) || !task.hasTitle()) {
              // data output to bottom bar
              const data = this.dumpData(task, -1);

              // create new if there is no persistent storage created for bottom bar
              if (!this.bottomBar[task.id]) {
                this.bottomBar[task.id] = {};
                this.bottomBar[task.id].data = [];

                const bottomBar = this.getTaskOptions(task).bottomBar;
                if (typeof bottomBar === 'boolean') {
                  this.bottomBar[task.id].items = 1;
                } else {
                  this.bottomBar[task.id].items = bottomBar;
                }
              }

              // persistent bottom bar and limit items in it
              if (!data?.some((element) => this.bottomBar[task.id].data.includes(element)) && !task.isSkipped()) {
                this.bottomBar[task.id].data = [...this.bottomBar[task.id].data, ...data];
              }
            } else if (task.isPending() || this.hasPersistentOutput(task)) {
              // keep output if persistent output is set
              output = [...output, ...this.dumpData(task, level)];
            }
          }

          // render subtasks, some complicated conditionals going on
          if (
            // check if renderer option is on first
            this.options.showSubtasks !== false &&
            // if it doesnt have subtasks no need to check
            task.hasSubtasks() &&
            (task.isPending() ||
              task.hasFailed() ||
              (task.isCompleted() && !task.hasTitle()) ||
              // have to be completed and have subtasks
              (task.isCompleted() &&
                this.options.collapse === false &&
                !task.subtasks.some((subtask) => subtask.rendererOptions.collapse === true)) ||
              // if any of the subtasks have the collapse option of
              task.subtasks.some((subtask) => subtask.rendererOptions.collapse === false) ||
              // if any of the subtasks has failed
              task.subtasks.some((subtask) => subtask.hasFailed()))
          ) {
            // set level
            const subtaskLevel = !task.hasTitle() ? level : level + 1;

            // render the subtasks as in the same way
            const subtaskRender = this.multiLineRenderer(task.subtasks, task.id, subtaskLevel);
            if (subtaskRender?.trim() !== '' && !task.subtasks.every((subtask) => !subtask.hasTitle())) {
              output = [...output, subtaskRender];
            }
          }

          // after task is finished actions
          if (task.isCompleted() || task.hasFailed() || task.isSkipped()) {
            // clean up prompts
            this.promptBar = null;

            if (!this.taskTime[id][task.id]) {
              this.taskTime[id][task.id] = timeSpan();
            }

            // clean up bottom bar items if not indicated otherwise
            if (!this.hasPersistentOutput(task)) {
              delete this.bottomBar[task.id];
            }
          }
        }
      }
    }

    if (level > 0 && this.currentTasks[id].length - this.options.maxSubTasks > 0) {
      output = [
        ...output,
        this.formatString(
          `... pending (${this.currentTasks[id].length - this.options.maxSubTasks})`,
          chalk.dim(figures.main.squareSmallFilled),
          level
        ),
      ];
    }

    if (output.length > 0) {
      return output.join(EOL);
    } else {
      return;
    }
  }

  private renderBottomBar(): string {
    // parse through all objects return only the last mentioned items
    if (Object.keys(this.bottomBar).length > 0) {
      this.bottomBar = Object.keys(this.bottomBar).reduce((o, key) => {
        if (!o?.[key]) {
          o[key] = {};
        }

        o[key] = this.bottomBar[key];

        this.bottomBar[key].data = this.bottomBar[key].data.slice(-this.bottomBar[key].items);
        o[key].data = this.bottomBar[key].data;
        return o;
      }, {});

      return Object.values(this.bottomBar)
        .reduce((o, value) => (o = [...o, ...value.data]), [])
        .join(EOL);
    }
  }

  private renderPrompt(): string {
    if (this.promptBar) {
      return this.promptBar;
    }
  }

  private dumpData(
    task: ListrTaskObject<ListrContext, typeof MyDefaultRenderer>,
    level: number,
    source: 'output' | 'skip' | 'error' = 'output'
  ): string[] {
    const output: string[] = [];

    let data: string | boolean;
    switch (source) {
      case 'output':
        data = task.output;
        break;
      case 'skip':
        data = task.message.skip;
        break;
      case 'error':
        data = task.message.error;
        break;
    }

    // dont return anything on some occasions
    if (task.hasTitle() && source === 'error' && data === task.title) {
      return;
    }

    if (typeof data === 'string' && data.trim() !== '') {
      // indent and color
      data
        .split(EOL)
        .filter(Boolean)
        .forEach((line, i) => {
          const icon = i === 0 ? this.getSymbol(task, true) : ' ';
          output.push(this.formatString(line, icon, level + 1));
        });
    }

    return output;
  }

  private formatString(string: string, icon: string, level: number): string {
    return `${cliTruncate(
      indentString(`${icon} ${string.trim()}`, level * this.options.indentation),
      process.stdout.columns ?? 80
    )}`;
  }

  // eslint-disable-next-line complexity
  private getSymbol(task: ListrTaskObject<ListrContext, typeof MyDefaultRenderer>, data = false): string {
    if (task.isPending() && !data) {
      return this.options?.lazy ||
        (this.options.showSubtasks !== false &&
          task.hasSubtasks() &&
          !task.subtasks.every((subtask) => !subtask.hasTitle()))
        ? chalk.yellow(figures.main.pointer)
        : chalk.yellowBright(this.spinner[this.spinnerPosition]);
    }

    if (task.isCompleted() && !data) {
      if (task.hasSubtasks() && task.subtasks.some((subtask) => subtask.hasFailed())) {
        return chalk.yellow(figures.main.warning);
      }

      return chalk.green(figures.main.tick);
    }

    if (task.hasFailed() && !data) {
      return task.hasSubtasks() ? chalk.red(figures.main.pointer) : chalk.red(figures.main.cross);
    }

    if (task.isSkipped() && !data && this.options.collapseSkips === false) {
      return chalk.yellow(figures.main.warning);
    } else if (task.isSkipped() && (data || this.options.collapseSkips)) {
      return chalk.yellow(figures.main.arrowDown);
    }

    if (!data) {
      return chalk.dim(figures.main.squareSmallFilled);
    } else {
      return figures.main.pointerSmall;
    }
  }
}
