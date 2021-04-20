import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class CleanupManifest extends SfdxCommand {
    static description: string;
    protected static flagsConfig: {
        manifest: flags.Discriminated<flags.String>;
        file: flags.Discriminated<flags.String>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
