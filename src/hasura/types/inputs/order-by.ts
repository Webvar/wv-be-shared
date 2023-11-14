import type {
  HasuraCrudDataType,
  HasuraCrudDataTypeRelationships,
  HasuraCrudPrimitive,
} from '../common';

export type HasuraCrudOrderBy = 'ASC' | 'DESC';

export type HasuraCrudInputOrderByRelationshipsOne<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [Key in keyof T['relationships']['one']]?: HasuraCrudInputOrderBy<
    T['relationships']['one'][Key]
  >;
};

export type HasuraCrudInputOrderByRelationships<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = HasuraCrudInputOrderByRelationshipsOne<T>;

export type HasuraCrudInputOrderByFields<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [Property in keyof T['type'] as T['type'][Property] extends HasuraCrudPrimitive
    ? Property
    : never]?: T['type'][Property] extends HasuraCrudPrimitive
    ? HasuraCrudOrderBy
    : never;
};

export type HasuraCrudInputOrderBy<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = HasuraCrudInputOrderByFields<T> & HasuraCrudInputOrderByRelationships<T>;
