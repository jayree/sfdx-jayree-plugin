/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import type { createLogUpdate } from 'log-update';
import type truncate from 'cli-truncate';
import type wrap from 'wrap-ansi';

import {
  ListrEventType,
  ListrTaskEventType,
  ListrTaskState,
  PromptError,
  PRESET_TIMER,
  ListrLogger,
  ListrLogLevels,
  ProcessOutputBuffer,
  Spinner,
  assertFunctionOrSelf,
  cleanseAnsi,
  color,
  indent,
  LISTR_DEFAULT_RENDERER_STYLE,
  ListrDefaultRendererLogLevels,
} from 'listr2';

import type {
  ListrRenderer,
  ListrTaskEventMap,
  ListrEventManager,
  ListrDefaultRendererOptions,
  ListrDefaultRendererTask,
  ListrDefaultRendererTaskOptions,
} from 'listr2';

interface MyListrDefaultRendererOptions extends ListrDefaultRendererOptions {
  maxSubTasks?: number;
  hideAfterSeconds?: number;
}

function startTimeSpan() {
  const start = process.hrtime.bigint();
  return { getTimeSpan: () => Number(process.hrtime.bigint() - start) / 1000000000 };
}

export class MyDefaultRenderer implements ListrRenderer {
  public static nonTTY = false;
  public static rendererOptions: MyListrDefaultRendererOptions = {
    indentation: 2,
    clearOutput: false,
    showSubtasks: true,
    collapseSubtasks: true,
    collapseSkips: true,
    showSkipMessage: true,
    suffixSkips: false,
    collapseErrors: true,
    showErrorMessage: true,
    suffixRetries: true,
    lazy: false,
    removeEmptyLines: true,
    formatOutput: 'wrap',
    maxSubTasks: 10,
    hideAfterSeconds: 5,
  };
  public static rendererTaskOptions: ListrDefaultRendererTaskOptions;

  private bottom: Map<string, ProcessOutputBuffer> = new Map();
  private prompt: string;
  private activePrompt: string;
  private readonly spinner: Spinner;
  private readonly logger: ListrLogger<ListrDefaultRendererLogLevels>;
  private updater: ReturnType<typeof createLogUpdate>;
  private truncate: typeof truncate;
  private wrap: typeof wrap;

  private taskTime: any = {};
  private currentTasks: any = {};
  private hiddenTasks: any = {};

  public constructor(
    private readonly tasks: ListrDefaultRendererTask[],
    private readonly options: MyListrDefaultRendererOptions,
    private readonly events: ListrEventManager
  ) {
    this.options = {
      ...MyDefaultRenderer.rendererOptions,
      ...this.options,
      icon: {
        ...LISTR_DEFAULT_RENDERER_STYLE.icon,
        ...(options?.icon ?? {}),
      },
      color: {
        ...LISTR_DEFAULT_RENDERER_STYLE.color,
        ...(options?.color ?? {}),
      },
    };

    this.spinner = this.options.spinner ?? new Spinner();

    this.logger =
      this.options.logger ?? new ListrLogger<ListrDefaultRendererLogLevels>({ useIcons: true, toStderr: [] });
    this.logger.options.icon = this.options.icon;
    this.logger.options.color = this.options.color;
  }

  // eslint-disable-next-line class-methods-use-this
  public getTaskOptions(task: ListrDefaultRendererTask): ListrDefaultRendererTaskOptions {
    return { ...MyDefaultRenderer.rendererTaskOptions, ...task.rendererTaskOptions };
  }

  public isBottomBar(task: ListrDefaultRendererTask): boolean {
    const bottomBar = this.getTaskOptions(task).bottomBar;

    return (
      (typeof bottomBar === 'number' && bottomBar !== 0) ||
      (typeof bottomBar === 'boolean' && bottomBar !== false) ||
      !task.hasTitle()
    );
  }

  public hasPersistentOutput(task: ListrDefaultRendererTask): boolean {
    return this.getTaskOptions(task).persistentOutput === true;
  }

  public getSelfOrParentOption<K extends keyof ListrDefaultRendererOptions>(
    task: ListrDefaultRendererTask,
    key: K
  ): ListrDefaultRendererOptions[K] {
    return task?.rendererOptions?.[key] ?? this.options?.[key];
  }

  public async render(): Promise<void> {
    const { createLogUpdate } = await import('log-update');
    const { default: truncate } = await import('cli-truncate');
    const { default: wrap } = await import('wrap-ansi');

    this.updater = createLogUpdate(this.logger.process.stdout);
    this.truncate = truncate;
    this.wrap = wrap;

    this.logger.process.hijack();

    /* istanbul ignore if */
    if (!this.options?.lazy) {
      this.spinner.start(() => {
        this.update();
      });
    }

    this.events.on(ListrEventType.SHOULD_REFRESH_RENDER, () => {
      this.update();
    });
  }

  public update(): void {
    this.updater(this.create());
  }

  public end(): void {
    this.spinner.stop();

    // clear log updater
    this.updater.clear();
    this.updater.done();

    // directly write to process.stdout, since logupdate only can update the seen height of terminal
    if (!this.options.clearOutput) {
      this.logger.process.toStdout(this.create({ prompt: false }));
    }

    this.logger.process.release();
  }

  public create(options?: { tasks?: boolean; bottomBar?: boolean; prompt?: boolean }): string {
    options = {
      tasks: true,
      bottomBar: true,
      prompt: true,
      ...options,
    };

    const render: string[] = [];

    const renderTasks = this.renderer(this.tasks);
    const renderBottomBar = this.renderBottomBar();
    const renderPrompt = this.renderPrompt();

    if (options.tasks && renderTasks.length > 0) {
      render.push(...renderTasks);
    }

    if (options.bottomBar && renderBottomBar.length > 0) {
      if (render.length > 0) {
        render.push('');
      }

      render.push(...renderBottomBar);
    }

    if (options.prompt && renderPrompt.length > 0) {
      if (render.length > 0) {
        render.push('');
      }

      render.push(...renderPrompt);
    }

    return render.join(EOL);
  }

  // eslint-disable-next-line complexity
  protected style(task: ListrDefaultRendererTask, output = false): string {
    if (task.isSkipped()) {
      if (output || this.getSelfOrParentOption(task, 'collapseSkips')) {
        return this.logger.icon(ListrDefaultRendererLogLevels.SKIPPED_WITH_COLLAPSE);
      } else if (this.getSelfOrParentOption(task, 'collapseSkips') === false) {
        return this.logger.icon(ListrDefaultRendererLogLevels.SKIPPED_WITHOUT_COLLAPSE);
      }
    }

    if (output) {
      if (this.isBottomBar(task)) {
        return this.logger.icon(ListrDefaultRendererLogLevels.OUTPUT_WITH_BOTTOMBAR);
      }

      return this.logger.icon(ListrDefaultRendererLogLevels.OUTPUT);
    }

    if (task.hasSubtasks()) {
      if (
        task.isStarted() ||
        (task.isPrompt() &&
          this.getSelfOrParentOption(task, 'showSubtasks') !== false &&
          !task.subtasks.every((subtask) => !subtask.hasTitle()))
      ) {
        return this.logger.icon(ListrDefaultRendererLogLevels.PENDING);
      } else if (task.isCompleted() && task.subtasks.some((subtask) => subtask.hasFailed())) {
        return this.logger.icon(ListrDefaultRendererLogLevels.COMPLETED_WITH_FAILED_SUBTASKS);
      } else if (task.hasFailed()) {
        return this.logger.icon(ListrDefaultRendererLogLevels.FAILED_WITH_FAILED_SUBTASKS);
      }
    }

    if (task.isStarted() || task.isPrompt()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.PENDING, !this.options?.lazy && this.spinner.fetch());
    } else if (task.isCompleted()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.COMPLETED);
    } else if (task.isRetrying()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.RETRY, !this.options?.lazy && this.spinner.fetch());
    } else if (task.isRollingBack()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.ROLLING_BACK, !this.options?.lazy && this.spinner.fetch());
    } else if (task.hasRolledBack()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.ROLLED_BACK);
    } else if (task.hasFailed()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.FAILED);
    } else if (task.isPaused()) {
      return this.logger.icon(ListrDefaultRendererLogLevels.PAUSED);
    }

    return this.logger.icon(ListrDefaultRendererLogLevels.WAITING);
  }

  protected format(message: string, icon: string, level: number): string[] {
    // we dont like empty data around here
    if (message.trim() === '') {
      return [];
    }

    if (icon) {
      message = icon + ' ' + message;
    }

    let parsed: string[];

    const columns = (process.stdout.columns ?? 80) - level * this.options.indentation - 2;

    switch (this.options.formatOutput) {
      case 'truncate':
        parsed = message.split(EOL).map((s, i) => this.truncate(this.indent(s, i), columns));

        break;

      case 'wrap':
        parsed = this.wrap(message, columns, { hard: true })
          .split(EOL)
          .map((s, i) => this.indent(s, i));

        break;

      default:
        throw new Error('Format option for the renderer is wrong.');
    }

    // this removes the empty lines
    if (this.options.removeEmptyLines) {
      parsed = parsed.filter(Boolean);
    }

    return parsed.map((str) => indent(str, level * this.options.indentation));
  }

  private renderer(tasks: ListrDefaultRendererTask[], id = 'root', level = 0): string[] {
    const preOutput: string[] = [];
    const postOutput: string[] = [];

    if (!this.taskTime[id]) {
      this.taskTime[id] = {};
    }
    if (!this.hiddenTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
      this.hiddenTasks[id] = tasks.filter(
        (t) =>
          level > 0 &&
          typeof this.taskTime[id][t.id] !== 'undefined' &&
          this.taskTime[id][t.id].getTimeSpan() > this.options.hideAfterSeconds
      );
    }

    if (!this.currentTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
      this.currentTasks[id] = tasks.filter(
        (t) =>
          level > 0 &&
          (typeof this.taskTime[id][t.id] === 'undefined' ||
            this.taskTime[id][t.id].getTimeSpan() <= this.options.hideAfterSeconds)
      );
    }

    if (this.hiddenTasks[id].length > 0 && tasks.filter((t) => t.isPending()).length !== 0) {
      const completed = this.hiddenTasks[id].filter((t) => t.isCompleted());
      if (completed.length > 0) {
        preOutput.push(
          ...this.format(
            `... completed (${completed.length})`,
            this.logger.icon(ListrDefaultRendererLogLevels.COMPLETED),
            level
          )
        );
      }
      const failed = this.hiddenTasks[id].filter((t) => t.hasFailed());
      if (failed.length > 0) {
        preOutput.push(
          ...this.format(`... failed (${failed.length})`, this.logger.icon(ListrDefaultRendererLogLevels.FAILED), level)
        );
      }
      const skipped = this.hiddenTasks[id].filter((t) => t.isSkipped());
      if (skipped.length > 0) {
        preOutput.push(
          ...this.format(
            `... skipped (${skipped.length})`,
            this.logger.icon(ListrDefaultRendererLogLevels.SKIPPED_WITH_COLLAPSE),
            level
          )
        );
      }
    }

    if (
      level > 0 &&
      this.currentTasks[id].length - this.options.maxSubTasks > 0 &&
      tasks.filter((t) => t.isPending()).length !== 0
    ) {
      postOutput.push(
        ...this.format(
          `... waiting (${this.currentTasks[id].length - this.options.maxSubTasks})`,
          this.logger.icon(ListrDefaultRendererLogLevels.WAITING),
          level
        )
      );
    }

    return [
      ...preOutput,
      // eslint-disable-next-line complexity
      ...tasks.flatMap((task) => {
        const output: string[] = [];
        const idx = this.currentTasks[id].findIndex((x) => x.title === task.title);
        if (
          (idx >= 0 && idx <= this.options.maxSubTasks - 1) ||
          level === 0 ||
          tasks.filter((t) => t.isPending() || typeof t.state === 'undefined').length === 0
        ) {
          if (!task.isEnabled()) {
            return [];
          }

          if (task.isPrompt()) {
            if (this.activePrompt && this.activePrompt !== task.id) {
              throw new PromptError(
                'Only one prompt can be active at the given time, please reevaluate your task design.'
              );
            } else if (!this.activePrompt) {
              task.on(ListrTaskEventType.PROMPT, (prompt: ListrTaskEventMap[ListrTaskEventType.PROMPT]): void => {
                const cleansed = cleanseAnsi(prompt);

                if (cleansed) {
                  this.prompt = cleansed;
                }
              });

              task.on(ListrTaskEventType.STATE, (state) => {
                if (state === ListrTaskState.PROMPT_COMPLETED || task.hasFinalized() || task.hasReset()) {
                  this.prompt = null;
                  this.activePrompt = null;
                  task.off(ListrTaskEventType.PROMPT);
                }
              });

              this.activePrompt = task.id;
            }
          }

          // Current Task Title
          if (task.hasTitle()) {
            if (
              !(
                tasks.some(
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  (task) => task.hasFailed()
                ) &&
                !task.hasFailed() &&
                task.options.exitOnError !== false &&
                !(task.isCompleted() || task.isSkipped())
              )
            ) {
              // if task is skipped
              if (task.hasFailed() && this.getSelfOrParentOption(task, 'collapseErrors')) {
                // current task title and skip change the title
                output.push(
                  ...this.format(
                    !task.hasSubtasks() && task.message.error && this.getSelfOrParentOption(task, 'showErrorMessage')
                      ? task.message.error
                      : task.title,
                    this.style(task),
                    level
                  )
                );
              } else if (task.isSkipped() && this.getSelfOrParentOption(task, 'collapseSkips')) {
                // current task title and skip change the title
                output.push(
                  ...this.format(
                    this.logger.suffix(
                      task.message.skip && this.getSelfOrParentOption(task, 'showSkipMessage')
                        ? task.message.skip
                        : task.title,
                      {
                        field: ListrLogLevels.SKIPPED,
                        condition: this.getSelfOrParentOption(task, 'suffixSkips'),
                        format: () => color.dim,
                      }
                    ),
                    this.style(task),
                    level
                  )
                );
              } else if (task.isRetrying()) {
                output.push(
                  ...this.format(
                    this.logger.suffix(task.title, {
                      field: `${ListrLogLevels.RETRY}:${task.message.retry.count}`,
                      format: () => color.yellow,
                      condition: this.getSelfOrParentOption(task, 'suffixRetries'),
                    }),
                    this.style(task),
                    level
                  )
                );
              } else if (
                task.isCompleted() &&
                task.hasTitle() &&
                assertFunctionOrSelf(this.getSelfOrParentOption(task, 'timer')?.condition, task.message.duration)
              ) {
                // task with timer
                output.push(
                  ...this.format(
                    this.logger.suffix(task?.title, {
                      ...this.getSelfOrParentOption(task, 'timer'),
                      args: [task.message.duration],
                    }),
                    this.style(task),
                    level
                  )
                );
              } else if (task.isPaused()) {
                output.push(
                  ...this.format(
                    this.logger.suffix(task.title, {
                      ...PRESET_TIMER,
                      args: [task.message.paused - Date.now()],
                    }),
                    this.style(task),
                    level
                  )
                );
              } else {
                // normal state
                output.push(...this.format(task.title, this.style(task), level));
              }
            } else {
              // some sibling task but self has failed and this has stopped
              output.push(
                ...this.format(
                  task.title,
                  this.logger.icon(ListrDefaultRendererLogLevels.COMPLETED_WITH_FAILED_SISTER_TASKS),
                  level
                )
              );
            }
          }

          // task should not have subtasks since subtasks will handle the error already
          // maybe it is a better idea to show the error or skip messages when show subtasks is disabled.
          if (!task.hasSubtasks() || !this.getSelfOrParentOption(task, 'showSubtasks')) {
            // without the collapse option for skip and errors
            if (
              task.hasFailed() &&
              this.getSelfOrParentOption(task, 'collapseErrors') === false &&
              (this.getSelfOrParentOption(task, 'showErrorMessage') ||
                !this.getSelfOrParentOption(task, 'showSubtasks'))
            ) {
              // show skip data if collapsing is not defined
              output.push(...this.dump(task, level, ListrLogLevels.FAILED));
            } else if (
              task.isSkipped() &&
              this.getSelfOrParentOption(task, 'collapseSkips') === false &&
              (this.getSelfOrParentOption(task, 'showSkipMessage') || !this.getSelfOrParentOption(task, 'showSubtasks'))
            ) {
              // show skip data if collapsing is not defined
              output.push(...this.dump(task, level, ListrLogLevels.SKIPPED));
            }
          }

          // Current Task Output
          if (task?.output) {
            if (this.isBottomBar(task)) {
              // create new if there is no persistent storage created for bottom bar
              if (!this.bottom.has(task.id)) {
                const bottomBar = this.getTaskOptions(task).bottomBar;

                this.bottom.set(
                  task.id,
                  new ProcessOutputBuffer({ limit: typeof bottomBar === 'boolean' ? 1 : bottomBar })
                );

                // eslint-disable-next-line @typescript-eslint/no-shadow
                task.on(ListrTaskEventType.OUTPUT, (output) => {
                  const data = this.dump(task, -1, ListrLogLevels.OUTPUT, output);

                  this.bottom.get(task.id).write(data.join(EOL));
                });
              }
            } else if (task.isPending() || this.hasPersistentOutput(task)) {
              // keep output if persistent output is set
              output.push(...this.dump(task, level));
            }
          }

          // render subtasks, some complicated conditionals going on
          if (
            // check if renderer option is on first
            this.getSelfOrParentOption(task, 'showSubtasks') !== false &&
            // if it doesnt have subtasks no need to check
            task.hasSubtasks() &&
            (task.isPending() ||
              (task.hasFinalized() && !task.hasTitle()) ||
              // have to be completed and have subtasks
              (task.isCompleted() &&
                this.getSelfOrParentOption(task, 'collapseSubtasks') === false &&
                !task.subtasks.some((subtask) => subtask.rendererOptions.collapseSubtasks === true)) ||
              // if any of the subtasks have the collapse option of
              task.subtasks.some((subtask) => subtask.rendererOptions.collapseSubtasks === false) ||
              // if any of the subtasks has failed
              task.subtasks.some((subtask) => subtask.hasFailed()) ||
              // if any of the subtasks rolled back
              task.subtasks.some((subtask) => subtask.hasRolledBack()))
          ) {
            // set level
            const subtaskLevel = !task.hasTitle() ? level : level + 1;

            // render the subtasks as in the same way
            const subtaskRender = this.renderer(task.subtasks, task.id, subtaskLevel);

            output.push(...subtaskRender);
          }

          // after task is finished actions
          if (task.hasFinalized()) {
            if (!this.taskTime[id][task.id]) {
              this.taskTime[id][task.id] = startTimeSpan();
            }

            // clean up bottom bar items if not indicated otherwise
            if (!this.hasPersistentOutput(task)) {
              this.bottom.delete(task.id);
            }
          }
        }

        return output;
      }),
      ...postOutput,
    ];
  }

  private renderBottomBar(): string[] {
    // parse through all objects return only the last mentioned items
    if (this.bottom.size === 0) {
      return [];
    }

    return Array.from(this.bottom.values())
      .flatMap((output) => output.all)
      .sort((a, b) => a.time - b.time)
      .map((output) => output.entry);
  }

  private renderPrompt(): string[] {
    if (!this.prompt) {
      return [];
    }

    return [this.prompt];
  }

  private dump(
    task: ListrDefaultRendererTask,
    level: number,
    source: ListrLogLevels.OUTPUT | ListrLogLevels.SKIPPED | ListrLogLevels.FAILED = ListrLogLevels.OUTPUT,
    data?: string | boolean
  ): string[] {
    if (!data) {
      switch (source) {
        case ListrLogLevels.OUTPUT:
          data = task.output;

          break;

        case ListrLogLevels.SKIPPED:
          data = task.message.skip;

          break;

        case ListrLogLevels.FAILED:
          data = task.message.error;

          break;
      }
    }

    // dont return anything on some occasions
    if ((task.hasTitle() && source === ListrLogLevels.FAILED && data === task.title) || typeof data !== 'string') {
      return [];
    }

    if (source === ListrLogLevels.OUTPUT) {
      data = cleanseAnsi(data);
    }

    return this.format(data, this.style(task, true), level + 1);
  }

  private indent(str: string, i: number): string {
    return i > 0 ? indent(str.trim(), this.options.indentation) : str.trim();
  }
}
