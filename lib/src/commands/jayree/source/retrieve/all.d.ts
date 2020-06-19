import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';
export default class RetrieveMetadata extends SourceRetrieveBase {
    static description: string;
    protected static flagsConfig: {
        keepcache: flags.Discriminated<flags.Boolean<boolean>>;
        skipfix: flags.Discriminated<flags.Boolean<boolean>>;
        verbose: flags.Builtin;
        scope: flags.Discriminated<flags.Option<string>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
