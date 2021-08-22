import { ComponentSet, VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
import { NodeFSTreeContainer as FSTreeContainer } from '@salesforce/source-deploy-retrieve/lib/src/resolve';
export declare const NodeFSTreeContainer: typeof FSTreeContainer;
export declare const debug: any;
export interface Ctx {
    projectRoot: string;
    sfdxProjectFolders: string[];
    sourceApiVersion: string;
    gitLines: Array<{
        path: string;
        status: string;
    }>;
    gitResults: {
        added: string[];
        deleted: string[];
        modified: {
            destructiveFiles: string[];
            manifestFiles: string[];
            toDestructiveChanges: Record<string, []>;
            toManifest: Record<string, []>;
        };
    };
    ref1VirtualTreeContainer: VirtualTreeContainer;
    ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer;
    destructiveChangesComponentSet: ComponentSet;
    manifestComponentSet: ComponentSet;
    git: {
        ref1: string;
        ref2: string;
        ref1ref2: string;
    };
    destructiveChanges: {
        files: string[];
    };
    manifest: {
        file: string;
    };
}
export declare function createVirtualTreeContainer(ref: any, modifiedFiles: any): Promise<VirtualTreeContainer>;
export declare function analyzeFile(path: any, ref1VirtualTreeContainer: any, ref2VirtualTreeContainer: any): {
    status: number;
    toManifest?: undefined;
    toDestructiveChanges?: undefined;
} | {
    status: number;
    toManifest: {};
    toDestructiveChanges: {};
};
export declare function getGitDiff(sfdxProjectFolders: any, ref1ref2: any): Promise<{
    path: string;
    status: string;
}[]>;
export declare function getGitResults(task: any, gitLines: any, ref1VirtualTreeContainer: any, ref2VirtualTreeContainer: any): {
    added: string[];
    modified: {
        destructiveFiles: string[];
        manifestFiles: string[];
        toManifest: Record<string, []>;
        toDestructiveChanges: Record<string, []>;
    };
    deleted: string[];
    unchanged: string[];
};
export declare function createManifest(virtualTreeContainer: any, options: {
    destruct: boolean;
}, results: any, task: any): ComponentSet;
