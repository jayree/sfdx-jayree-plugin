import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class ScratchOrgSettings extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        writetoprojectscratchdeffile: flags.Discriminated<flags.Boolean<boolean>>;
        file: flags.Discriminated<flags.String>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private throwError;
}
