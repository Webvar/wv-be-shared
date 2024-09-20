import { FieldNode, GraphQLInterfaceType, GraphQLObjectType, GraphQLResolveInfo, GraphQLScalarType, GraphQLSchema, SelectionSetNode } from 'graphql';
import type { HasuraCrudDataType } from './types/common.js';
import type { HasuraCrudInputBoolExp } from './types/inputs/index.js';
export declare const createBaseTypes: (prefix: string | undefined, baseScalars: GraphQLScalarType[]) => GraphQLSchema;
export declare enum SchemaResolverType {
    GET_MANY = "getMany",
    GET_AGGREGATE = "getAggregate",
    GET_BY_PK = "getByPK"
}
export declare const createSchema: (prefix: string | undefined, baseTypes: GraphQLSchema, entity: GraphQLInterfaceType | GraphQLObjectType, pkField?: string, resolvers?: SchemaResolverType[]) => GraphQLSchema;
export declare const graphqlSelectionSetToPrismaInclude: (selectionSet: SelectionSetNode | undefined | null, fields: string[]) => Record<string, unknown> | undefined;
export declare const graphqlInfoToPrismaInclude: (info: GraphQLResolveInfo, fields: string[]) => Record<string, unknown> | undefined;
export type PrismaWhere = {
    OR?: PrismaWhere[];
    AND?: PrismaWhere[];
    NOT?: PrismaWhere;
} & Record<string, Record<string, unknown>>;
export declare const graphqlWhereToPrismaWhere: (where?: HasuraCrudInputBoolExp<HasuraCrudDataType<unknown, never>>) => {
    prismaWhere: PrismaWhere;
    fullTextSearch?: string | undefined;
};
export declare const graphqlOrderByToPrismaOrderBy: (order?: Record<string, unknown>[] | null) => {
    [k: string]: string;
}[] | undefined;
export declare const graphqlInfoHasSelection: (fieldName: string, info: GraphQLResolveInfo) => FieldNode | undefined;
