import type { ListrRenderer, ListrEventManager, ListrDefaultRendererOptions, ListrDefaultRendererTask, ListrDefaultRendererTaskOptions } from 'listr2';
interface MyListrDefaultRendererOptions extends ListrDefaultRendererOptions {
    maxSubTasks?: number;
    hideAfterSeconds?: number;
}
export declare class MyDefaultRenderer implements ListrRenderer {
    private readonly tasks;
    private readonly options;
    private readonly events;
    static nonTTY: boolean;
    static rendererOptions: MyListrDefaultRendererOptions;
    static rendererTaskOptions: ListrDefaultRendererTaskOptions;
    private bottom;
    private prompt;
    private activePrompt;
    private readonly spinner;
    private readonly logger;
    private updater;
    private truncate;
    private wrap;
    private taskTime;
    private currentTasks;
    private hiddenTasks;
    constructor(tasks: ListrDefaultRendererTask[], options: MyListrDefaultRendererOptions, events: ListrEventManager);
    getTaskOptions(task: ListrDefaultRendererTask): ListrDefaultRendererTaskOptions;
    isBottomBar(task: ListrDefaultRendererTask): boolean;
    hasPersistentOutput(task: ListrDefaultRendererTask): boolean;
    getSelfOrParentOption<K extends keyof ListrDefaultRendererOptions>(task: ListrDefaultRendererTask, key: K): ListrDefaultRendererOptions[K];
    render(): Promise<void>;
    update(): void;
    end(): void;
    create(options?: {
        tasks?: boolean;
        bottomBar?: boolean;
        prompt?: boolean;
    }): string;
    protected style(task: ListrDefaultRendererTask, output?: boolean): string;
    protected format(message: string, icon: string, level: number): string[];
    private renderer;
    private renderBottomBar;
    private renderPrompt;
    private dump;
    private indent;
}
export {};
