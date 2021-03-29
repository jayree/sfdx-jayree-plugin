export declare const debug: any;
declare type argvConnection = {
    username: string;
    instanceUrl: string;
};
declare let argvConnection: argvConnection;
export declare function getProjectPath(): Promise<string>;
export declare function shrinkPermissionSets(permissionsets: any): Promise<void>;
export declare function profileElementInjection(profiles: any, ensureObjectPermissionsFromAdmin?: {
    ensureObjectPermissions: any;
}, customObjectsFilter?: any[]): Promise<void>;
export declare function moveSourceFilesByFolder(): Promise<Array<{
    from: string;
    to: string;
}>>;
export declare function logFixes(updatedfiles: any): Promise<void>;
export declare function logMoves(movedSourceFiles: any): Promise<void>;
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
export declare function updateProfiles(profiles: any, retrievePackageDir: any, forceSourcePull: any): Promise<void>;
export {};
