import { flags } from '@salesforce/command';
import { Connection } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as jsforce from 'jsforce';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';
declare global {
    interface Array<T> {
        pushUniqueValueKey(elem: T, key: string): T[];
        pushUniqueValue(elem: T): T[];
    }
    interface String {
        toLowerCaseifTrue(ignore: boolean): string;
    }
}
/**
 * This code was based on the original github:sfdx-hydrate project
 */
export default class GeneratePackageXML extends JayreeSfdxCommand {
    static aliases: string[];
    static description: string;
    static examples: string[];
    static args: {
        name: string;
    }[];
    protected static flagsConfig: {
        configfile: flags.Discriminated<flags.String>;
        quickfilter: flags.Discriminated<flags.String>;
        matchcase: flags.Discriminated<flags.Boolean<boolean>>;
        matchwholeword: flags.Discriminated<flags.Boolean<boolean>>;
        includeflowversions: flags.Discriminated<flags.Boolean<boolean>>;
        file: flags.Discriminated<flags.String>;
        excludemanaged: flags.Discriminated<flags.Boolean<boolean>>;
    };
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
    toolingQuery(conn: Connection, soql: string): Promise<jsforce.QueryResult<Record<string, any>>>;
    getMetaData(conn: Connection, apiVersion: string): Promise<jsforce.DescribeMetadataResult>;
    listMetaData(conn: Connection, query: jsforce.ListMetadataQuery | jsforce.ListMetadataQuery[], apiVersion: string): Promise<jsforce.FileProperties | jsforce.FileProperties[]>;
    private throwError;
}
