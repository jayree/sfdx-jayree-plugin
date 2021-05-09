import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';
export default class RetrieveMetadata extends SourceRetrieveBase {
    static description: string;
    static hidden: boolean;
    protected static flagsConfig: {
        keepcache: flags.Discriminated<flags.Boolean<boolean>>;
        skipfix: flags.Discriminated<flags.Boolean<boolean>>;
        verbose: flags.Builtin;
        scope: flags.Discriminated<flags.String>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
