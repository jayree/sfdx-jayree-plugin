import { SfdxCommand } from '@salesforce/command';
export declare abstract class SourceRetrieveBase extends SfdxCommand {
    log(msg: any, indent?: any): void;
    protected getScopedValue(config: any): any;
    protected profileElementInjection(root: any): Promise<void>;
    protected applyfixes(config: any, tags: any, projectpath: any): Promise<any>;
    protected sourcefix(fixsources: any, root: any, conn: any): Promise<string[]>;
    protected sourcedelete(deletesources: any, root: any): Promise<string[]>;
    protected cleanuppackagexml(manifest: any, manifestignore: any, root: any): Promise<void>;
}
