import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { SourceRetrieveBase } from '../../../../sourceRetrieveBase';
export default class RetrieveProfiles extends SourceRetrieveBase {
    static description: string;
    protected static flagsConfig: {
        keepcache: flags.Discriminated<flags.Boolean<boolean>>;
        metadata: flags.Discriminated<flags.Array<string>>;
        verbose: flags.Builtin;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
