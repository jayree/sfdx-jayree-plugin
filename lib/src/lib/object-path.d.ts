import * as objectPath from 'object-path';
interface QueryParameters {
    path: any;
    key?: any;
    value?: any;
}
declare class ObjectPathResolver {
    _path: any[];
    _object: any;
    constructor(object: any);
    value(): any[];
    resolve({ path, key, value }: QueryParameters): this;
    resolveString(string: any): this;
}
export { ObjectPathResolver, objectPath };
