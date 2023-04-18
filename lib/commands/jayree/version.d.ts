import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';
export default class Version extends SfCommand<AnyJson> {
    static readonly hidden = true;
    run(): Promise<AnyJson>;
}
