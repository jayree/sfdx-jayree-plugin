export declare class PuppeteerTasks {
    currenTask: any;
    private tasks;
    private nextTaskIndex;
    private browser;
    private auth;
    constructor(auth: any, tasks: string[]);
    execute(): Promise<boolean>;
    getNext(): this;
    close(): Promise<void>;
    open(): Promise<void>;
}
