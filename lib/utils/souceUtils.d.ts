declare type argvConnection = {
    username: string;
    instanceUrl: string;
};
declare let argvConnection: argvConnection;
export declare function getProjectPath(): Promise<string>;
export declare function shrinkPermissionSets(permissionsets: any): Promise<void>;
export declare function profileElementInjection(profiles: any, customObjectsFilter?: any[]): Promise<void>;
export declare function logFixes(updatedfiles: any): Promise<void>;
export declare function getConnectionFromArgv(): Promise<argvConnection>;
export declare function applyFixes(tags: any, root?: any, filter?: any[]): Promise<aggregatedFixResults>;
export declare function applySourceFixes(filter: string[]): Promise<aggregatedFixResults>;
export declare type aggregatedFixResults = {
    [workaround: string]: fixResults;
};
declare type fixResults = fixResult[];
declare type fixResult = {
    filePath: string;
    operation: string;
    message: string;
};
export declare function updateProfiles(profiles: any, customObjects: any, forceSourcePull: any): Promise<void>;
export {};
