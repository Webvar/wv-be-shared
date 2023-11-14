export type HasuraCrudDataTypeRelationshipMap = {
    [key: string]: HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>;
};
export type HasuraCrudDataTypeRelationships = {
    one: HasuraCrudDataTypeRelationshipMap;
    many: HasuraCrudDataTypeRelationshipMap;
};
export type HasuraCrudDataType<T, N extends string, R extends HasuraCrudDataTypeRelationships = {
    one: Record<string, never>;
    many: Record<string, never>;
}, I = 'id'> = {
    id: I;
    type: T;
    name: N;
    relationships: R;
};
export type HasuraCrudPrimitive = Date | string | number | boolean | null;
export type HasuraCrudFields<T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>> = keyof T['type'];
