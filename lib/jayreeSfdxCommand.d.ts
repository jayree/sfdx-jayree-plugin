import { SfdxCommand } from '@salesforce/command';
export declare abstract class JayreeSfdxCommand extends SfdxCommand {
    warnIfRunByAlias(aliases: string[], id: string): void;
}
