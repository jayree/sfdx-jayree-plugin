import { SfdxCommand } from '@salesforce/command';
export declare abstract class JayreeSfdxCommand extends SfdxCommand {
    warnIfRunByAlias(commandClass: any): void;
}
