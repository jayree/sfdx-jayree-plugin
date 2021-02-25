import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class DeployChangeSet extends SfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: {
        changeset: flags.Discriminated<flags.String>;
        runtests: flags.Discriminated<flags.String>;
        testlevel: flags.Discriminated<flags.String>;
        checkonly: flags.Discriminated<flags.Boolean<boolean>>;
        nodialog: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    private login;
    private selecttest;
    private clickvalidateordeploy;
    private clickvalidateordeploy2;
    private getjob;
    private gettables;
}
