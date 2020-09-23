import { Command, Hook, IConfig } from '@oclif/config';
declare type HookFunction = (this: Hook.Context, options: HookOptions) => any;
declare type HookOptions = {
    Command: Command.Class;
    argv: string[];
    commandId: string;
    result?: PostSourceUpdateResult;
    config: IConfig;
};
declare type PostSourceUpdateResult = {
    [aggregateName: string]: {
        workspaceElements: Array<{
            fullName: string;
            metadataName: string;
            filePath: string;
            state: string;
            deleteSupported: boolean;
        }>;
    };
};
export declare const postsourceupdate: HookFunction;
export {};
