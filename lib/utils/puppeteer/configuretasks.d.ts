export declare class PuppeteerConfigureTasks {
    currenTask: any;
    private tasks;
    private nextTaskIndex;
    private browser;
    private context;
    private auth;
    constructor(auth: any, tasks: string[]);
    private static subExec;
    getNext(): this;
    close(): Promise<void>;
    open(): Promise<void>;
    execute(listrTask: any): Promise<boolean>;
}
