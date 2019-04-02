import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class UserSyncStatus extends SfdxCommand {
  static description: string;
  static examples: string[];
  protected static flagsConfig: {
    officeuser: flags.Discriminated<flags.Option<string>>;
    statusonly: flags.Discriminated<flags.Boolean<boolean>>;
    wait: flags.Discriminated<flags.Number>;
  };
  protected static requiresUsername: boolean;
  protected static supportsDevhubUsername: boolean;
  protected static requiresProject: boolean;
  run(): Promise<AnyJson>;
  private checkUserSetup;
  private checkUserReset;
  private checkContactsEvents;
  private login;
  private resetuser;
  private gettables;
  private checkstatus;
}
