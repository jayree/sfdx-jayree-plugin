import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class SourceTrackingList extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        revision: flags.Discriminated<flags.Number>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
