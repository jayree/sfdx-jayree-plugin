import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class Streaming extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        topic: flags.Discriminated<flags.String>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
