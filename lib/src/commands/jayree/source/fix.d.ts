import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { SourceRetrieveBase } from '../../../sourceRetrieveBase';
export default class FixMetadata extends SourceRetrieveBase {
    static description: string;
    protected static flagsConfig: {
        tag: flags.Discriminated<flags.Array<string>>;
        verbose: flags.Builtin;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
