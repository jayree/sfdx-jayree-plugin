export declare const debug: any;
export interface Ctx {
    tmpbasepath: string;
    projectRoot: string;
    sfdxProjectFolders: string[];
    sfdxProject: {
        packageDirectories: [{
            path: string;
        }];
        sourceApiVersion: string;
    };
    gitResults: {
        added: string[];
        deleted: string[];
        modified: {
            toDestructiveChanges: Record<string, []>;
            toManifest: Record<string, []>;
        };
    };
    destructiveChangesProjectPath: string;
    manifestProjectPath: string;
    destructiveChangesManifestFile: string;
    manifestFile: string;
    destructiveChangesSourceFiles: string[];
    manifestSourceFiles: string[];
    git: {
        ref1: string;
        ref2: string;
        ref1ref2: string;
    };
    destructiveChanges: {
        content: Record<string, unknown>;
        files: string[];
    };
    manifest: {
        content: Record<string, unknown>;
        file: string;
    };
    warnings: Record<string, Record<string, string[]>>;
}
export declare function ensureDirsInTempProject(basePath: string, ctx: Ctx): Promise<void>;
export declare function prepareTempProject(type: string, ctx: Ctx): Promise<string>;
export declare function addFilesToTempProject(tmpRoot: any, paths: any, task: any, ctx: Ctx): Promise<string[]>;
export declare function convertTempProject(convertpath: string, options: {
    destruct: boolean;
}, task: any, ctx: Ctx): Promise<string>;
export declare function appendToManifest(file: any, insert: any, options?: {
    destruct: boolean;
}): Promise<Record<string, unknown>>;
export declare function analyzeFile(path: any, ctx: Ctx): Promise<{
    status: number;
    toManifest?: undefined;
    toDestructiveChanges?: undefined;
} | {
    status: number;
    toManifest: {};
    toDestructiveChanges: {};
}>;
export declare function getGitResults(task: any, ctx: Ctx): Promise<{
    added: string[];
    modified: {
        toManifest: Record<string, []>;
        toDestructiveChanges: Record<string, []>;
    };
    deleted: string[];
}>;
