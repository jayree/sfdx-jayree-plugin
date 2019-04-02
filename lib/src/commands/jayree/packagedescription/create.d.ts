import { flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
export default class CreatePackageDescription extends SfdxCommand {
  static description: string;
  static examples: string[];
  static args: {
    name: string;
  }[];
  protected static flagsConfig: {
    file: flags.Discriminated<flags.Option<string>>;
    description: flags.Discriminated<flags.Option<string>>;
  };
  protected static requiresUsername: boolean;
  protected static supportsDevhubUsername: boolean;
  protected static requiresProject: boolean;
  run(): Promise<AnyJson>;
}
