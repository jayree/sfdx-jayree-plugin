import { Command, Hook, IConfig } from '@oclif/config';
import { FileResponse } from '@salesforce/source-deploy-retrieve';
declare type HookFunction = (this: Hook.Context, options: HookOptions) => any;
declare type HookOptions = {
    Command: Command.Class;
    argv: string[];
    commandId: string;
    result: FileResponse[];
    config: IConfig;
};
export declare const postretrieve: HookFunction;
export {};
