import { flags } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';
export default class ImportState extends JayreeSfdxCommand {
    static aliases: string[];
    static description: string;
    protected static flagsConfig: {
        countrycode: flags.Discriminated<flags.String>;
        category: flags.Discriminated<flags.String>;
        language: flags.Discriminated<flags.String>;
        concurrent: flags.Discriminated<flags.Number>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    private isOutputEnabled;
    run(): Promise<AnyJson>;
}
