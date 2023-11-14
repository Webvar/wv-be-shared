import type {
  HasuraCrudDataType,
  HasuraCrudDataTypeRelationships,
} from './common';
import type {
  HasuraCrudQueryGetManyArgs,
  HasuraCrudQueryGetAggregateArgs,
  HasuraCrudQueryGetOneArgs,
} from './inputs';

export type HasuraCrudResolverQueryGetMany<
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C
> = {
  [_Key in Uncapitalize<T['name']>]: (
    _root: unknown,
    _args: HasuraCrudQueryGetManyArgs<T>,
    _context: C
  ) => Promise<T['type'][]>;
};

export type HasuraCrudResolverQueryGetAggregate<
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C
> = {
  [_Key in Uncapitalize<T['name']>]: (
    _root: unknown,
    _args: HasuraCrudQueryGetAggregateArgs<T>,
    _context: C
  ) => Promise<{ aggregate: { count: number }, nodes: T['type'][] }>;
};

export type HasuraCrudResolverQueryGetOne<
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C
> = {
  [_Key in `${Uncapitalize<T['name']>}ByPk`]: (
    _root: unknown,
    _args: HasuraCrudQueryGetOneArgs<T>,
    _context: C
  ) => Promise<T['type']>;
};

export type HasuraCrudResolversQuery<
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C
> = HasuraCrudResolverQueryGetMany<T, C> & HasuraCrudResolverQueryGetOne<T, C> & HasuraCrudResolverQueryGetAggregate<T, C>;

export type HasuraCrudResolverMutationDeleteMany<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `delete${Capitalize<T['name']>}`]: () => Promise<T['type']>;
};
export type HasuraCrudResolverMutationDeleteOne<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `delete${Capitalize<T['name']>}ByPk`]: () => Promise<T['type']>;
};
export type HasuraCrudResolverMutationInsertMany<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `insert${Capitalize<T['name']>}`]: () => Promise<T['type']>;
};
export type HasuraCrudResolverMutationInsertOne<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `insert${Capitalize<T['name']>}One`]: () => Promise<T['type']>;
};
export type HasuraCrudResolverMutationUpdateMany<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `update${Capitalize<T['name']>}`]: () => Promise<T['type']>;
};
export type HasuraCrudResolverMutationUpdateOne<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [_Key in `update${Capitalize<T['name']>}ByPk`]: () => Promise<T['type']>;
};

export type HasuraCrudResolversMutation<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = HasuraCrudResolverMutationDeleteMany<T> &
  HasuraCrudResolverMutationDeleteOne<T> &
  HasuraCrudResolverMutationInsertMany<T> &
  HasuraCrudResolverMutationInsertOne<T> &
  HasuraCrudResolverMutationUpdateMany<T> &
  HasuraCrudResolverMutationUpdateOne<T>;

export type HasuraCrudResolvers<
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C
> = HasuraCrudResolversQuery<T, C>;
