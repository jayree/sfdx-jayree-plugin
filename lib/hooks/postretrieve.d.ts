import { Hook, Config } from '@oclif/core';
import { FileResponse } from '@salesforce/source-deploy-retrieve';
type HookFunction = (this: Hook.Context, options: HookOptions) => any;
type HookOptions = {
    Command: any;
    argv: string[];
    commandId: string;
    result: FileResponse[];
    config: Config;
};
export declare const postretrieve: HookFunction;
export {};
