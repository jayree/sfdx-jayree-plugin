import { Hook, Config } from '@oclif/core';
type HookFunction = (this: Hook.Context, options: HookOptions) => any;
type HookOptions = {
    Command: any;
    argv: string[];
    commandId: string;
    result?: PreRetrieveResult;
    config: Config;
};
type PreRetrieveResult = {
    packageXmlPath: string;
};
export declare const preretrieve: HookFunction;
export {};
