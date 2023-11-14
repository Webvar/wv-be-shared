import { GraphQLInterfaceType, GraphQLObjectType, GraphQLScalarType, GraphQLSchema } from 'graphql';
import type { HasuraCrudResolversQuery } from './types/resolvers';
import type { HasuraCrudDataType, HasuraCrudDataTypeRelationships } from './types/common';
export declare const createBaseTypes: (prefix: string | undefined, baseScalars: GraphQLScalarType[]) => GraphQLSchema;
export declare enum SchemaResolverType {
    GET_MANY = "getMany",
    GET_AGGREGATE = "getAggregate",
    GET_BY_PK = "getByPK"
}
export declare const createSchema: (prefix: string | undefined, baseTypes: GraphQLSchema, entity: GraphQLInterfaceType | GraphQLObjectType, pkField?: string, resolvers?: SchemaResolverType[]) => GraphQLSchema;
export declare const createResolvers: <T extends HasuraCrudDataType<unknown, string, HasuraCrudDataTypeRelationships>, C, Me>(entityName: string, dbPath: string, initDb: () => Promise<any>) => {
    Query: HasuraCrudResolversQuery<T, C>;
};
