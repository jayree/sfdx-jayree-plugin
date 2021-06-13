import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';
export default class UpdateCountry extends JayreeSfdxCommand {
    static aliases: string[];
    static description: string;
    protected static flagsConfig: {
        silent: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
