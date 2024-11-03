import { GraphQLSchema, defaultFieldResolver } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { Resource, Value } from '@cerbos/core';

import { isAllowed } from './authorizationHelper';
import { Me, PrincipalMe } from '../../types/common';


type ContextHandler = (context: string[]) => Promise<Record<string, Value>>;
const defaultHandler: ContextHandler = async () => ({});
export const authDirective = (directiveName: string, schema: GraphQLSchema, contextHandler: ContextHandler = defaultHandler) => {
  const typeDirectiveArgumentMaps: Record<string, unknown> = {};
  return mapSchema(schema, {
    [MapperKind.TYPE]: (type) => {
      const authDirective = getDirective(schema, type, directiveName)?.[0];
      if (authDirective) {
        typeDirectiveArgumentMaps[type.name] = authDirective;
      }
      return type;
    },
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
      const directive =
        getDirective(schema, fieldConfig, directiveName)?.[0] ??
        typeDirectiveArgumentMaps[typeName];

      if (directive) {
        const {
          resource,
          action = 'read',
          context: directiveContext = [],
        }: { resource?: string; action?: string, context?: string[] } = directive;

        if (resource) {
          // Check whether this field has the specified directive
          const resolver = fieldConfig.resolve || defaultFieldResolver;

          // Replace the original resolver with a function that *first* calls
          // the original resolver, then converts its result to upper case
          fieldConfig.resolve = async (source, args, context, info) => {
            const me = context.req.me as Me;
            const currentResource: PrincipalMe = {
              id: me.id,
              roles: me.roles,
              attr: {
                ...me,
              },
            };

            const fetchedContext = await contextHandler?.(directiveContext) || {};
            const specifiedResource: Resource = {
              id: resource,
              kind: resource,
              attr: {
                args,
                context: fetchedContext,
              },
            };
            const allowed = await isAllowed(
              currentResource as PrincipalMe,
              specifiedResource,
              action,
            );
            if (!allowed) {
              throw new Error(
                `You are not allowed to perform this action or you don't have enough permissions to see the whole content`
              );
            }

            // If is allowed, then we should run the original resolver
            const result = await resolver(source, args, context, info);
            return result;
          };
        }
      }
      return fieldConfig;
    },
  });
};
