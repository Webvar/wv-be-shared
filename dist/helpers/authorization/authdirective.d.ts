import { GraphQLSchema } from 'graphql';
import { Value } from '@cerbos/core';
import { Me } from '../../types/common.js';
type ContextHandler = (payload: {
    context: string[];
    args: unknown;
    user: Me;
}) => Promise<Record<string, Value>>;
export declare const authDirective: (directiveName: string, schema: GraphQLSchema, contextHandler?: ContextHandler) => GraphQLSchema;
export {};
