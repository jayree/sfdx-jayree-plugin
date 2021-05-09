import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class ScratchOrgRevisionInfo extends SfdxCommand {
    static description: string;
    static hidden: boolean;
    static examples: string[];
    protected static flagsConfig: {
        startfromrevision: flags.Discriminated<flags.Number>;
        setlocalmaxrevision: flags.Discriminated<flags.Boolean<boolean>>;
        storerevision: flags.Discriminated<flags.Boolean<boolean>>;
        restorerevision: flags.Discriminated<flags.Boolean<boolean>>;
        localrevisionvalue: flags.Discriminated<flags.Number>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private throwError;
}
