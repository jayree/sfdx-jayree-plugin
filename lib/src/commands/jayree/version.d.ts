import { SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class Version extends SfdxCommand {
    static hidden: boolean;
    run(): Promise<AnyJson>;
}
