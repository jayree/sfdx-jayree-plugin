import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class ConfigureOrg extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        tasks: flags.Discriminated<flags.Array<string>>;
        concurrent: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    private isOutputEnabled;
    run(): Promise<AnyJson>;
}
