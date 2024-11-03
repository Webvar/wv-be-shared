import { GraphQLSchema } from 'graphql';
import { Value } from '@cerbos/core';
type ContextHandler = (context: string[]) => Promise<Record<string, Value>>;
export declare const authDirective: (directiveName: string, schema: GraphQLSchema, contextHandler?: ContextHandler) => GraphQLSchema;
export {};
