import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';
export default class ScratchOrgSettings extends JayreeSfdxCommand {
    static aliases: string[];
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
