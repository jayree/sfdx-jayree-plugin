import { SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class GitDiff extends SfdxCommand {
    static description: string;
    static examples: string[];
    static args: {
        name: string;
        required: boolean;
        description: string;
        parse: (input: any) => any;
        hidden: boolean;
    }[];
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    private isOutputEnabled;
    run(): Promise<AnyJson>;
    private getGitArgsFromArgv;
}
