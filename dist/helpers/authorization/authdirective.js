import { defaultFieldResolver } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { isAllowed } from './authorizationHelper.js';
const defaultHandler = async () => ({});
export const authDirective = (directiveName, schema, contextHandler = defaultHandler) => {
    const typeDirectiveArgumentMaps = {};
    return mapSchema(schema, {
        [MapperKind.TYPE]: (type) => {
            var _a;
            const authDirective = (_a = getDirective(schema, type, directiveName)) === null || _a === void 0 ? void 0 : _a[0];
            if (authDirective) {
                typeDirectiveArgumentMaps[type.name] = authDirective;
            }
            return type;
        },
        [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
            var _a, _b;
            const directive = (_b = (_a = getDirective(schema, fieldConfig, directiveName)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : typeDirectiveArgumentMaps[typeName];
            if (directive) {
                const { resource, action = 'read', context: directiveContext = [], } = directive;
                if (resource) {
                    // Check whether this field has the specified directive
                    const resolver = fieldConfig.resolve || defaultFieldResolver;
                    // Replace the original resolver with a function that *first* calls
                    // the original resolver, then converts its result to upper case
                    fieldConfig.resolve = async (source, args, context, info) => {
                        const me = context.req.me;
                        const currentResource = {
                            id: me.id,
                            roles: me.roles,
                            attr: {
                                ...me,
                            },
                        };
                        const fetchedContext = await (contextHandler === null || contextHandler === void 0 ? void 0 : contextHandler({ context: directiveContext, args, user: me })) || {};
                        const specifiedResource = {
                            id: resource,
                            kind: resource,
                            attr: {
                                args,
                                context: fetchedContext,
                            },
                        };
                        const allowed = await isAllowed(currentResource, specifiedResource, action);
                        if (!allowed) {
                            throw new Error(`You are not allowed to perform this action or you don't have enough permissions to see the whole content`);
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
