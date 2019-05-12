import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class CreateUpdateStateCountry extends SfdxCommand {
    static description: string;
    protected static flagsConfig: {
        countrycode: flags.Discriminated<flags.Option<string>>;
        category: flags.Discriminated<flags.Option<string>>;
        language: flags.Discriminated<flags.Option<string>>;
        uselocalvariant: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
