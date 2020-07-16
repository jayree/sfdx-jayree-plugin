import * as objectPath from 'object-path';
interface QueryParameters {
    path: any;
    key?: any;
    value?: any;
}
declare class ObjectPathResolver {
    _path: string;
    _object: string;
    constructor(object: any);
    value(): string;
    resolve({ path, key, value }: QueryParameters): this;
    resolveString(string: any): this;
}
export { ObjectPathResolver, objectPath };
