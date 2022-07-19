import { ListrRenderer, ListrTaskObject } from 'listr2';
/** Default updating renderer for Listr2 */
export declare class MyDefaultRenderer implements ListrRenderer {
    tasks: Array<ListrTaskObject<any, typeof MyDefaultRenderer>>;
    options: typeof MyDefaultRenderer['rendererOptions'];
    renderHook$?: ListrTaskObject<any, any>['renderHook$'];
    /** designates whether this renderer can output to a non-tty console */
    static nonTTY: boolean;
    /** renderer options for the defauult renderer */
    static rendererOptions: {
        /**
         * indentation per level of subtask
         *
         * @default 2
         */
        indentation?: number;
        /**
         * clear all the output generated by the renderer when the task finishes its execution
         *
         * @default false
         * @global global option that can not be temperated with subtasks
         */
        clearOutput?: boolean;
        /**
         * show the subtasks of the current task
         *
         * @default true
         */
        showSubtasks?: boolean;
        /**
         * collapse subtasks after current task completes its execution
         *
         * @default true
         */
        collapse?: boolean;
        /**
         * show skip messages or show the original title of the task, this will also disable collapseSkips mode
         *
         * You can disable showing the skip messages, even though you passed in a message by settings this option,
         * if you want to keep the original task title intact.
         *
         * @default true
         */
        showSkipMessage?: boolean;
        /**
         * collapse skip messages into a single message and overwrite the task title
         *
         * @default true
         */
        collapseSkips?: boolean;
        /**
         * suffix skip messages with [SKIPPED] when in collapseSkips mode
         *
         * @default true
         */
        suffixSkips?: boolean;
        /**
         * shows the thrown error message or show the original title of the task, this will also disable collapseErrors mode
         * You can disable showing the error messages, even though you passed in a message by settings this option,
         * if you want to keep the original task title intact.
         *
         * @default true
         */
        showErrorMessage?: boolean;
        /**
         * collapse error messages into a single message and overwrite the task title
         *
         * @default true
         */
        collapseErrors?: boolean;
        /**
         * suffix retry messages with [RETRY-${COUNT}] when retry is enabled for a task
         *
         * @default true
         */
        suffixRetries?: boolean;
        /**
         * only update through triggers from renderhook
         *
         * useful for tests and stuff. this will disable showing spinner and only update the screen if something else has
         * happened in the task worthy to show
         *
         * @default false
         * @global global option that can not be temperated with subtasks
         */
        lazy?: boolean;
        /**
         * show duration for all tasks
         *
         * @default false
         * @global global option that can not be temperated with subtasks
         */
        showTimer?: boolean;
        /**
         * removes empty lines from the data output
         *
         * @default true
         */
        removeEmptyLines?: boolean;
        /**
         * formats data output depending on your requirements.
         *
         * @default 'truncate'
         * @global global option that can not be temperated with subtasks
         */
        formatOutput?: 'truncate' | 'wrap';
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
    };
    /** per task options for the default renderer */
    static rendererTaskOptions: {
        /**
         * write task output to the bottom bar instead of the gap under the task title itself.
         * useful for a stream of data.
         *
         * @default false
         *
         * `true` only keep 1 line of the latest data outputted by the task.
         * `false` only keep 1 line of the latest data outputted by the task.
         * `number` will keep designated data of the latest data outputted by the task.
         */
        bottomBar?: boolean | number;
        /**
         * keep output after task finishes
         *
         * @default false
         *
         * works both for the bottom bar and the default behavior
         */
        persistentOutput?: boolean;
        /**
         * show the task time if it was successful
         */
        showTimer?: boolean;
    };
    private id?;
    private bottomBar;
    private promptBar;
    private readonly spinner;
    private spinnerPosition;
    private taskTime;
    private currentTasks;
    private hiddenTasks;
    constructor(tasks: Array<ListrTaskObject<any, typeof MyDefaultRenderer>>, options: typeof MyDefaultRenderer['rendererOptions'], renderHook$?: ListrTaskObject<any, any>['renderHook$']);
    private static getTaskOptions;
    private static isBottomBar;
    private static hasPersistentOutput;
    private static hasTimer;
    private static getTaskTime;
    private static indentMultilineOutput;
    private static addSuffixToMessage;
    getSelfOrParentOption<T extends keyof typeof MyDefaultRenderer['rendererOptions']>(task: ListrTaskObject<any, typeof MyDefaultRenderer>, key: T): typeof MyDefaultRenderer['rendererOptions'][T];
    createRender(options?: {
        tasks?: boolean;
        bottomBar?: boolean;
        prompt?: boolean;
    }): string;
    render(): void;
    end(): void;
    private multiLineRenderer;
    private renderBottomBar;
    private renderPrompt;
    private dumpData;
    private formatString;
    private getSymbol;
}
