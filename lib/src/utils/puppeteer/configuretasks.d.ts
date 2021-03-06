export declare class PuppeteerConfigureTasks {
    currenTask: any;
    private tasks;
    private nextTaskIndex;
    private browser;
    private auth;
    constructor(auth: any, tasks: string[]);
    getNext(): this;
    close(): Promise<void>;
    open(): Promise<void>;
    execute(listrTask: any): Promise<boolean>;
    private subExec;
}
