import { Command, Hook, IConfig } from '@oclif/config';
declare type HookFunction = (this: Hook.Context, options: HookOptions) => any;
declare type HookOptions = {
    Command: Command.Class;
    argv: string[];
    commandId: string;
    result?: PostRetrieveResult;
    config: IConfig;
};
declare type PostRetrieveResult = {
    [fullName: string]: {
        mdapiFilePath: string;
    };
};
export declare const postretrieve: HookFunction;
export {};
