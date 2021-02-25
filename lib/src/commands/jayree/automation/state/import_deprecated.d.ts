import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class ImportState extends SfdxCommand {
    static hidden: boolean;
    static description: string;
    protected static flagsConfig: {
        countrycode: flags.Discriminated<flags.String>;
        category: flags.Discriminated<flags.String>;
        language: flags.Discriminated<flags.String>;
        uselocalvariant: flags.Discriminated<flags.Boolean<boolean>>;
        silent: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
