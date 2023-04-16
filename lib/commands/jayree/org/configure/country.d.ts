import { flags, SfdxCommand } from '@salesforce/command';
export default class UpdateCountry extends SfdxCommand {
    static description: string;
    protected static flagsConfig: {
        silent: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<void>;
}
