import type {
  HasuraCrudDataType,
  HasuraCrudDataTypeRelationships,
  HasuraCrudPrimitive,
} from '../common';

export type HasuraCrudInputComparisonExp<T extends HasuraCrudPrimitive> = {
  _eq?: NonNullable<T>;
  _gt?: NonNullable<T>;
  _gte?: NonNullable<T>;
  _in?: NonNullable<T>[];
  _isNull?: boolean;
  _lt?: NonNullable<T>;
  _lte?: NonNullable<T>;
  _neq?: NonNullable<T>;
  _nin?: NonNullable<T>[];
  _has?: NonNullable<T>[];
};

export type HasuraCrudInputStringComparisonExp =
  HasuraCrudInputComparisonExp<string> & {
    _ilike?: string;
    _iregex?: string;
    _like?: string;
    _nilike?: string;
    _niregex?: string;
    _nlike?: string;
    _nregex?: string;
    _nsimilar?: string;
    _regex?: string;
    _similar?: string;
    _fts?: string;
  };

export type HasuraCrudInputBoolExpRelationshipsOne<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [Key in keyof T['relationships']['one']]?: HasuraCrudInputBoolExp<
    T['relationships']['one'][Key]
  >;
};
export type HasuraCrudInputBoolExpRelationshipsMany<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [Key in keyof T['relationships']['many']]?: HasuraCrudInputBoolExp<
    T['relationships']['many'][Key]
  >;
};
export type HasuraCrudInputBoolExpRelationships<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = HasuraCrudInputBoolExpRelationshipsOne<T> &
  HasuraCrudInputBoolExpRelationshipsMany<T>;

export type HasuraCrudInputBoolExpChains<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  _and?: HasuraCrudInputBoolExp<T>[];
  _not?: HasuraCrudInputBoolExp<T>;
  _or?: HasuraCrudInputBoolExp<T>[];
};

export type HasuraCrudInputBoolExpFields<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = {
  [Property in keyof T['type'] as T['type'][Property] extends HasuraCrudPrimitive
    ? Property
    : never]?: T['type'][Property] extends HasuraCrudPrimitive
    ? HasuraCrudInputComparisonExp<T['type'][Property]>
    : never;
};

export type HasuraCrudInputBoolExp<
  T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>
> = HasuraCrudInputBoolExpFields<T> &
  HasuraCrudInputBoolExpChains<T> &
  HasuraCrudInputBoolExpRelationships<T>;
