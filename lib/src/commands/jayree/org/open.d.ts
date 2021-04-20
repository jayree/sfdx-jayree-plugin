import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class OrgOpen extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        browser: flags.Discriminated<flags.String>;
        path: flags.Discriminated<flags.String>;
        urlonly: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
