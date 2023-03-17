import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class FixMetadata extends SfdxCommand {
    static description: string;
    protected static flagsConfig: {
        tag: flags.Discriminated<flags.Array<string>>;
        verbose: flags.Builtin;
    };
    protected static supportsUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}