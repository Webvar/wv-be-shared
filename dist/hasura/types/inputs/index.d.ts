import type { HasuraCrudFields, HasuraCrudDataType, HasuraCrudDataTypeRelationships } from '../common.js';
import type { HasuraCrudInputOrderBy } from './order-by.js';
import type { HasuraCrudInputBoolExp } from './where.js';
export type HasuraCrudQueryGetManyArgs<T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>> = {
    distinctOn?: [HasuraCrudFields<T>];
    limit?: number;
    offset?: number;
    orderBy?: HasuraCrudInputOrderBy<T>[];
    where?: HasuraCrudInputBoolExp<T>;
};
export type HasuraCrudQueryGetAggregateArgs<T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>> = {
    distinctOn?: [HasuraCrudFields<T>];
    limit?: number;
    offset?: number;
    orderBy?: HasuraCrudInputOrderBy<T>[];
    where?: HasuraCrudInputBoolExp<T>;
};
export type HasuraCrudQueryGetOneArgs<T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>> = {
    [Key in T['id']]: Key extends keyof T['type'] ? T['type'][Key] : string;
};
export * from './where.js';
export * from './order-by.js';
