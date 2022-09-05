import { Hook, Config } from '@oclif/core';
declare type HookFunction = (this: Hook.Context, options: HookOptions) => any;
declare type HookOptions = {
    Command: any;
    argv: string[];
    commandId: string;
    result?: PreRetrieveResult;
    config: Config;
};
declare type PreRetrieveResult = {
    packageXmlPath: string;
};
export declare const preretrieve: HookFunction;
export {};
