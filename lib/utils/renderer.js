/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import cliTruncate from 'cli-truncate';
import logUpdate from 'log-update';
import cliWrap from 'wrap-ansi';
import { figures } from 'listr2';
import { createColors } from 'colorette';
const colorette = createColors({ useColor: process.env?.LISTR_DISABLE_COLOR !== '1' });
function indentString(string, count) {
    return string.replace(/^(?!\s*$)/gm, ' '.repeat(count));
}
function isUnicodeSupported() {
    if (process.platform !== 'win32') {
        return true;
    }
    /* istanbul ignore next */
    return (Boolean(process.env.CI) ||
        Boolean(process.env.WT_SESSION) ||
        process.env.TERM_PROGRAM === 'vscode' ||
        process.env.TERM === 'xterm-256color' ||
        process.env.TERM === 'alacritty');
}
function parseTaskTime(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    let parsedTime;
    if (seconds === 0 && minutes === 0) {
        parsedTime = `0.${Math.floor(duration / 100)}s`;
    }
    if (seconds > 0) {
        parsedTime = `${seconds % 60}s`;
    }
    if (minutes > 0) {
        parsedTime = `${minutes}m${parsedTime}`;
    }
    return parsedTime;
}
function startTimeSpan() {
    const start = process.hrtime.bigint();
    return { getTimeSpan: () => Number(process.hrtime.bigint() - start) / 1000000000 };
}
/** Default updating renderer for Listr2 */
export class MyDefaultRenderer {
    constructor(tasks, options, renderHook$) {
        this.tasks = tasks;
        this.options = options;
        this.renderHook$ = renderHook$;
        this.bottomBar = {};
        this.spinner = !isUnicodeSupported()
            ? ['-', '\\', '|', '/']
            : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerPosition = 0;
        this.taskTime = {};
        this.currentTasks = {};
        this.hiddenTasks = {};
        this.options = { ...MyDefaultRenderer.rendererOptions, ...this.options };
    }
    static getTaskOptions(task) {
        return { ...MyDefaultRenderer.rendererTaskOptions, ...task.rendererTaskOptions };
    }
    static isBottomBar(task) {
        const bottomBar = MyDefaultRenderer.getTaskOptions(task).bottomBar;
        return ((typeof bottomBar === 'number' && bottomBar !== 0) || (typeof bottomBar === 'boolean' && bottomBar !== false));
    }
    static hasPersistentOutput(task) {
        return MyDefaultRenderer.getTaskOptions(task).persistentOutput === true;
    }
    static hasTimer(task) {
        return MyDefaultRenderer.getTaskOptions(task).showTimer === true;
    }
    /* istanbul ignore next */
    static getTaskTime(task) {
        return colorette.dim(`[${parseTaskTime(task.message.duration)}]`);
    }
    static indentMultilineOutput(str, i) {
        return i > 0 ? indentString(str.trim(), 2) : str.trim();
    }
    static addSuffixToMessage(message, suffix, condition) {
        return condition ?? true ? message + colorette.dim(` [${suffix}]`) : message;
    }
    getSelfOrParentOption(task, key) {
        return task?.rendererOptions?.[key] ?? this.options?.[key];
    }
    createRender(options) {
        options = {
            ...{
                tasks: true,
                bottomBar: true,
                prompt: true,
            },
            ...options,
        };
        const render = [];
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
    render() {
        // Do not render if we are already rendering
        if (this.id) {
            return;
        }
        const updateRender = () => logUpdate(this.createRender());
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
    end() {
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
    multiLineRenderer(tasks, id = 'root', level = 0) {
        let output = [];
        if (!this.taskTime[id]) {
            this.taskTime[id] = {};
        }
        if (!this.hiddenTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
            this.hiddenTasks[id] = tasks.filter((t) => level > 0 &&
                typeof this.taskTime[id][t.id] !== 'undefined' &&
                this.taskTime[id][t.id].getTimeSpan() > this.options.hideAfterSeconds);
        }
        if (!this.currentTasks[id] || this.currentTasks[id].length > this.options.maxSubTasks) {
            this.currentTasks[id] = tasks.filter((t) => level > 0 &&
                (typeof this.taskTime[id][t.id] === 'undefined' ||
                    this.taskTime[id][t.id].getTimeSpan() <= this.options.hideAfterSeconds));
        }
        if (this.hiddenTasks[id].length > 0 && tasks.filter((t) => t.isPending()).length !== 0) {
            const completed = this.hiddenTasks[id].filter((t) => t.isCompleted());
            if (completed.length > 0) {
                output = [
                    ...output,
                    this.formatString(`... completed (${completed.length})`, colorette.green(figures.tick), level),
                ];
            }
            const failed = this.hiddenTasks[id].filter((t) => t.hasFailed());
            if (failed.length > 0) {
                output = [...output, this.formatString(`... failed (${failed.length})`, colorette.red(figures.cross), level)];
            }
            const skipped = this.hiddenTasks[id].filter((t) => t.isSkipped());
            if (skipped.length > 0) {
                output = [
                    ...output,
                    this.formatString(`... skipped (${skipped.length})`, colorette.yellow(figures.arrowDown), level),
                ];
            }
        }
        for (const task of tasks) {
            const idx = this.currentTasks[id].findIndex((x) => x.title === task.title);
            if ((idx >= 0 && idx <= this.options.maxSubTasks - 1) ||
                level === 0 ||
                tasks.filter((t) => t.isPending() || typeof t.state === 'undefined').length === 0) {
                if (task.isEnabled()) {
                    // Current Task Title
                    if (task.hasTitle()) {
                        if (!(tasks.some(
                        // eslint-disable-next-line @typescript-eslint/no-shadow
                        (task) => task.hasFailed()) &&
                            !task.hasFailed() &&
                            task.options.exitOnError !== false &&
                            !(task.isCompleted() || task.isSkipped()))) {
                            // if task is skipped
                            if (task.hasFailed() && this.getSelfOrParentOption(task, 'collapseErrors')) {
                                // current task title and skip change the title
                                output = [
                                    ...output,
                                    this.formatString(!task.hasSubtasks() && task.message.error && this.getSelfOrParentOption(task, 'showErrorMessage')
                                        ? task.message.error
                                        : task.title, this.getSymbol(task), level),
                                ];
                            }
                            else if (task.isSkipped() && this.getSelfOrParentOption(task, 'collapseSkips')) {
                                // current task title and skip change the title
                                output = [
                                    ...output,
                                    this.formatString(MyDefaultRenderer.addSuffixToMessage(task.message.skip && this.getSelfOrParentOption(task, 'showSkipMessage')
                                        ? task.message.skip
                                        : task.title, 'SKIPPED', this.getSelfOrParentOption(task, 'suffixSkips')), this.getSymbol(task), level),
                                ];
                            }
                            else if (task.isRetrying() && this.getSelfOrParentOption(task, 'suffixRetries')) {
                                output = [
                                    ...output,
                                    this.formatString(MyDefaultRenderer.addSuffixToMessage(task.title, `RETRYING-${task.message.retry.count}`), this.getSymbol(task), level),
                                ];
                            }
                            else if (task.isCompleted() &&
                                task.hasTitle() &&
                                (this.getSelfOrParentOption(task, 'showTimer') || MyDefaultRenderer.hasTimer(task))) {
                                // task with timer
                                output = [
                                    ...output,
                                    this.formatString(`${task?.title} ${MyDefaultRenderer.getTaskTime(task)}`, this.getSymbol(task), level),
                                ];
                            }
                            else {
                                // normal state
                                output = [...output, this.formatString(task.title, this.getSymbol(task), level)];
                            }
                        }
                        else {
                            // some sibling task but self has failed and this has stopped
                            output = [...output, this.formatString(task.title, colorette.red(figures.squareSmallFilled), level)];
                        }
                    }
                    // task should not have subtasks since subtasks will handle the error already
                    // maybe it is a better idea to show the error or skip messages when show subtasks is disabled.
                    if (!task.hasSubtasks() || !this.getSelfOrParentOption(task, 'showSubtasks')) {
                        // without the collapse option for skip and errors
                        if (task.hasFailed() &&
                            this.getSelfOrParentOption(task, 'collapseErrors') === false &&
                            (this.getSelfOrParentOption(task, 'showErrorMessage') ||
                                !this.getSelfOrParentOption(task, 'showSubtasks'))) {
                            // show skip data if collapsing is not defined
                            output = [...output, this.dumpData(task, level, 'error')];
                        }
                        else if (task.isSkipped() &&
                            this.getSelfOrParentOption(task, 'collapseSkips') === false &&
                            (this.getSelfOrParentOption(task, 'showSkipMessage') || !this.getSelfOrParentOption(task, 'showSubtasks'))) {
                            // show skip data if collapsing is not defined
                            output = [...output, this.dumpData(task, level, 'skip')];
                        }
                    }
                    // Current Task Output
                    if (task?.output) {
                        if ((task.isPending() || task.isRetrying() || task.isRollingBack()) && task.isPrompt()) {
                            // data output to prompt bar if prompt
                            this.promptBar = task.output;
                        }
                        else if (MyDefaultRenderer.isBottomBar(task) || !task.hasTitle()) {
                            // data output to bottom bar
                            const data = [this.dumpData(task, -1)];
                            // create new if there is no persistent storage created for bottom bar
                            if (!this.bottomBar[task.id]) {
                                this.bottomBar[task.id] = {};
                                this.bottomBar[task.id].data = [];
                                const bottomBar = MyDefaultRenderer.getTaskOptions(task).bottomBar;
                                if (typeof bottomBar === 'boolean') {
                                    this.bottomBar[task.id].items = 1;
                                }
                                else {
                                    this.bottomBar[task.id].items = bottomBar;
                                }
                            }
                            // persistent bottom bar and limit items in it
                            if (!this.bottomBar[task.id]?.data?.some((element) => data.includes(element)) && !task.isSkipped()) {
                                this.bottomBar[task.id].data = [...this.bottomBar[task.id].data, ...data];
                            }
                        }
                        else if (task.isPending() ||
                            task.isRetrying() ||
                            task.isRollingBack() ||
                            MyDefaultRenderer.hasPersistentOutput(task)) {
                            // keep output if persistent output is set
                            output = [...output, this.dumpData(task, level)];
                        }
                    }
                    // render subtasks, some complicated conditionals going on
                    if (
                    // check if renderer option is on first
                    this.getSelfOrParentOption(task, 'showSubtasks') !== false &&
                        // if it doesnt have subtasks no need to check
                        task.hasSubtasks() &&
                        (task.isPending() ||
                            task.hasFailed() ||
                            (task.isCompleted() && !task.hasTitle()) ||
                            // have to be completed and have subtasks
                            (task.isCompleted() &&
                                this.getSelfOrParentOption(task, 'collapse') === false &&
                                !task.subtasks.some((subtask) => subtask.rendererOptions.collapse === true)) ||
                            // if any of the subtasks have the collapse option of
                            task.subtasks.some((subtask) => subtask.rendererOptions.collapse === false) ||
                            // if any of the subtasks has failed
                            task.subtasks.some((subtask) => subtask.hasFailed()) ||
                            // if any of the subtasks rolled back
                            task.subtasks.some((subtask) => subtask.hasRolledBack()))) {
                        // set level
                        const subtaskLevel = !task.hasTitle() ? level : level + 1;
                        // render the subtasks as in the same way
                        const subtaskRender = this.multiLineRenderer(task.subtasks, task.id, subtaskLevel);
                        if (subtaskRender?.trim() !== '' && !task.subtasks.every((subtask) => !subtask.hasTitle())) {
                            output = [...output, subtaskRender];
                        }
                    }
                    // after task is finished actions
                    if (task.isCompleted() || task.hasFailed() || task.isSkipped() || task.hasRolledBack()) {
                        // clean up prompts
                        this.promptBar = null;
                        if (!this.taskTime[id][task.id]) {
                            this.taskTime[id][task.id] = startTimeSpan();
                        }
                        // clean up bottom bar items if not indicated otherwise
                        if (!MyDefaultRenderer.hasPersistentOutput(task)) {
                            delete this.bottomBar[task.id];
                        }
                    }
                }
            }
        }
        if (level > 0 && this.currentTasks[id].length - this.options.maxSubTasks > 0) {
            output = [
                ...output,
                this.formatString(`... pending (${this.currentTasks[id].length - this.options.maxSubTasks})`, colorette.dim(figures.squareSmallFilled), level),
            ];
        }
        output = output.filter(Boolean);
        if (output.length > 0) {
            return output.join(EOL);
        }
        else {
            return;
        }
    }
    renderBottomBar() {
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
                .filter(Boolean)
                .join(EOL);
        }
    }
    renderPrompt() {
        if (this.promptBar) {
            return this.promptBar;
        }
    }
    dumpData(task, level, source = 'output') {
        let data;
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
        if (typeof data === 'string') {
            return this.formatString(data, this.getSymbol(task, true), level + 1);
        }
    }
    formatString(str, icon, level) {
        // we dont like empty data around here
        if (str.trim() === '') {
            return;
        }
        str = `${icon} ${str}`;
        let parsedStr;
        let columns = process.stdout.columns ? process.stdout.columns : 80;
        columns = columns - level * this.options.indentation - 2;
        switch (this.options.formatOutput) {
            case 'truncate':
                parsedStr = str.split(EOL).map((s, i) => cliTruncate(MyDefaultRenderer.indentMultilineOutput(s, i), columns));
                break;
            case 'wrap':
                parsedStr = cliWrap(str, columns, { hard: true })
                    .split(EOL)
                    .map((s, i) => MyDefaultRenderer.indentMultilineOutput(s, i));
                break;
            default:
                throw new Error('Format option for the renderer is wrong.');
        }
        // this removes the empty lines
        if (this.options.removeEmptyLines) {
            parsedStr = parsedStr.filter(Boolean);
        }
        return indentString(parsedStr.join(EOL), level * this.options.indentation);
    }
    // eslint-disable-next-line complexity
    getSymbol(task, data = false) {
        if (task.isPending() && !data) {
            return this.options?.lazy ||
                (this.getSelfOrParentOption(task, 'showSubtasks') !== false &&
                    task.hasSubtasks() &&
                    !task.subtasks.every((subtask) => !subtask.hasTitle()))
                ? colorette.yellow(figures.pointer)
                : colorette.yellowBright(this.spinner[this.spinnerPosition]);
        }
        else if (task.isCompleted() && !data) {
            return task.hasSubtasks() && task.subtasks.some((subtask) => subtask.hasFailed())
                ? colorette.yellow(figures.warning)
                : colorette.green(figures.tick);
        }
        else if (task.isRetrying() && !data) {
            return this.options?.lazy
                ? colorette.yellow(figures.warning)
                : colorette.yellow(this.spinner[this.spinnerPosition]);
        }
        else if (task.isRollingBack() && !data) {
            return this.options?.lazy ? colorette.red(figures.warning) : colorette.red(this.spinner[this.spinnerPosition]);
        }
        else if (task.hasRolledBack() && !data) {
            return colorette.red(figures.arrowLeft);
        }
        else if (task.hasFailed() && !data) {
            return task.hasSubtasks() ? colorette.red(figures.pointer) : colorette.red(figures.cross);
        }
        else if (task.isSkipped() && !data && this.getSelfOrParentOption(task, 'collapseSkips') === false) {
            return colorette.yellow(figures.warning);
        }
        else if (task.isSkipped() && (data || this.getSelfOrParentOption(task, 'collapseSkips'))) {
            return colorette.yellow(figures.arrowDown);
        }
        return !data ? colorette.dim(figures.squareSmallFilled) : figures.pointerSmall;
    }
}
/** designates whether this renderer can output to a non-tty console */
MyDefaultRenderer.nonTTY = false;
/** renderer options for the defauult renderer */
MyDefaultRenderer.rendererOptions = {
    indentation: 2,
    clearOutput: false,
    showSubtasks: true,
    collapse: true,
    collapseSkips: true,
    showSkipMessage: true,
    suffixSkips: true,
    collapseErrors: true,
    showErrorMessage: true,
    suffixRetries: true,
    lazy: false,
    showTimer: false,
    removeEmptyLines: true,
    formatOutput: 'truncate',
    maxSubTasks: 10,
    hideAfterSeconds: 5,
};
//# sourceMappingURL=renderer.js.map