import { ComponentSet, VirtualTreeContainer, SourceComponent, NodeFSTreeContainer as FSTreeContainer } from '@salesforce/source-deploy-retrieve';
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
        manifest: ComponentSet;
        destructiveChanges: ComponentSet;
        unchanged: string[];
        ignored: {
            ref1: string[];
            ref2: string[];
        };
        counts: {
            added: number;
            deleted: number;
            modified: number;
            unchanged: number;
            ignored: number;
            error: number;
        };
        errors: string[];
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
export declare function ensureOSPath(path: string): string;
export declare function ensureGitPath(path: string): string;
export declare function createVirtualTreeContainer(ref: string, modifiedFiles: string[]): Promise<VirtualTreeContainer>;
export declare function analyzeFile(path: string, ref1VirtualTreeContainer: VirtualTreeContainer, ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer): Promise<{
    status: number;
    toManifest?: SourceComponent[];
    toDestructiveChanges?: SourceComponent[];
}>;
export declare function getGitDiff(sfdxProjectFolders: string[], ref1ref2: string): Promise<Ctx['gitLines']>;
export declare function getGitResults(gitLines: Ctx['gitLines'], ref1VirtualTreeContainer: VirtualTreeContainer, ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer): Promise<Ctx['gitResults']>;
export declare function buildManifestComponentSet(cs: ComponentSet, forDestructiveChanges?: boolean): ComponentSet;
