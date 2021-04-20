import { Command, Hook, IConfig } from '@oclif/config';
declare type HookFunction = (this: Hook.Context, options: HookOptions) => any;
declare type HookOptions = {
    Command: Command.Class;
    argv: string[];
    commandId: string;
    result?: PreRetrieveResult;
    config: IConfig;
};
declare type PreRetrieveResult = {
    packageXmlPath: string;
};
export declare const preretrieve: HookFunction;
export {};
