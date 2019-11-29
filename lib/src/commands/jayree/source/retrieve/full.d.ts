import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class RetrieveProfiles extends SfdxCommand {
    static description: string;
    protected static flagsConfig: {
        keepcache: flags.Discriminated<flags.Boolean<boolean>>;
        metadata: flags.Discriminated<flags.Array<string>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
