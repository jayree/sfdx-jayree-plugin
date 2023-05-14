import { SfCommand } from '@salesforce/sf-plugins-core';
import { AnyJson } from '@salesforce/ts-types';
export default class ScratchOrgSettings extends SfCommand<AnyJson> {
    static readonly summary: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/lib/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        writetoprojectscratchdeffile: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        file: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    static readonly requiresProject = true;
    run(): Promise<AnyJson>;
    private throwError;
}
