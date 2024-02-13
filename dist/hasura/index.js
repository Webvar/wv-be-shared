import { GraphQLEnumType, GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLScalarType, GraphQLSchema, GraphQLString, Kind, } from 'graphql';
import camelcase from 'camelcase';
import createOrderByEnum from './order-by.js';
import createComparisonExpInputObjectType from './comparison-exp.js';
import createComparisonExpStringType from './string-comparison-exp.js';
export const createBaseTypes = (prefix = '', baseScalars) => {
    return new GraphQLSchema({
        types: [
            createOrderByEnum(prefix),
            ...baseScalars.map((scalar) => scalar.name === 'String' ? createComparisonExpStringType() : createComparisonExpInputObjectType('', scalar)),
        ],
    });
};
const convertScalarToComparisonExp = (prefix = '', baseTypes, scalar) => {
    prefix =
        scalar.name === GraphQLString.name ||
            scalar.name === GraphQLInt.name ||
            scalar.name === GraphQLID.name
            ? prefix
            : '';
    const comparisonExp = baseTypes.getType(`${prefix}${scalar.name}ComparisonExp`);
    if (comparisonExp) {
        return comparisonExp;
    }
    return baseTypes.getType(`${prefix}${GraphQLString.name}ComparisonExp`);
};
export var SchemaResolverType;
(function (SchemaResolverType) {
    SchemaResolverType["GET_MANY"] = "getMany";
    SchemaResolverType["GET_AGGREGATE"] = "getAggregate";
    SchemaResolverType["GET_BY_PK"] = "getByPK";
})(SchemaResolverType || (SchemaResolverType = {}));
const schemaResolverTypes = [
    SchemaResolverType.GET_MANY,
    SchemaResolverType.GET_AGGREGATE,
    SchemaResolverType.GET_BY_PK,
];
export const createSchema = (prefix = '', baseTypes, entity, pkField = 'id', resolvers = schemaResolverTypes) => {
    const OrderBy = baseTypes.getType(`${prefix}OrderBy`);
    const EntitySelectColumn = new GraphQLEnumType({
        name: `${entity.name}SelectColumn`,
        description: `select columns of table "${entity.name.toLowerCase()}"`,
        values: Object.fromEntries(Object.keys(entity.getFields()).map((field) => {
            return [
                field,
                {
                    value: field,
                    description: 'column name',
                },
            ];
        })),
    });
    const EntityOrderBy = new GraphQLInputObjectType({
        name: `${entity.name}OrderBy`,
        description: `Ordering options when selecting data from "${entity.name.toLowerCase()}".`,
        fields: Object.fromEntries(Object.keys(entity.getFields()).map((field) => {
            return [
                field,
                {
                    type: OrderBy,
                },
            ];
        })),
    });
    const EntityBoolExp = new GraphQLInputObjectType({
        name: `${entity.name}BoolExp`,
        description: `Boolean expression to filter rows from the table "${entity.name.toLowerCase()}". All fields are combined with a logical 'AND'.`,
        fields: () => ({
            _and: {
                type: new GraphQLList(new GraphQLNonNull(EntityBoolExp)),
            },
            _not: {
                type: EntityBoolExp,
            },
            _or: {
                type: new GraphQLList(new GraphQLNonNull(EntityBoolExp)),
            },
            ...Object.fromEntries(Object.entries(entity.getFields())
                .map(([field, definition]) => {
                let definitionType = definition.type;
                if (definitionType instanceof GraphQLNonNull) {
                    definitionType = definitionType.ofType;
                }
                if (!(definitionType instanceof GraphQLScalarType)) {
                    return [field, null];
                }
                const type = convertScalarToComparisonExp(prefix, baseTypes, definitionType);
                return [
                    field,
                    {
                        type,
                    },
                ];
            })
                .filter(([, definition]) => !!definition)),
        }),
    });
    const EntityAggregate = new GraphQLObjectType({
        name: `${entity.name}Aggregate`,
        description: `aggregated selection of "${entity.name.toLowerCase()}"`,
        fields: {
            aggregate: {
                type: new GraphQLObjectType({
                    name: `${entity.name}AggregateFields`,
                    description: `aggregate fields of "${entity.name.toLowerCase()}"`,
                    fields: {
                        count: {
                            type: new GraphQLNonNull(GraphQLInt),
                        },
                    },
                }),
            },
            nodes: {
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entity))),
            },
        },
    });
    const queryFields = {};
    if (resolvers.includes(SchemaResolverType.GET_MANY)) {
        queryFields[camelcase(entity.name)] = {
            type: new GraphQLList(new GraphQLNonNull(entity)),
            args: {
                distinctOn: {
                    type: EntitySelectColumn,
                },
                limit: { type: GraphQLInt },
                offset: { type: GraphQLInt },
                orderBy: {
                    type: new GraphQLList(new GraphQLNonNull(EntityOrderBy)),
                },
                where: {
                    type: EntityBoolExp,
                },
            },
        };
    }
    if (resolvers.includes(SchemaResolverType.GET_AGGREGATE)) {
        queryFields[`${camelcase(entity.name)}Aggregate`] = {
            type: new GraphQLNonNull(EntityAggregate),
            args: {
                distinctOn: {
                    type: EntitySelectColumn,
                },
                limit: { type: GraphQLInt },
                offset: { type: GraphQLInt },
                orderBy: {
                    type: new GraphQLList(new GraphQLNonNull(EntityOrderBy)),
                },
                where: {
                    type: EntityBoolExp,
                },
            },
        };
    }
    if (resolvers.includes(SchemaResolverType.GET_BY_PK)) {
        let pkType = entity.getFields()[pkField].type;
        if (!(pkType instanceof GraphQLNonNull)) {
            pkType = new GraphQLNonNull(pkType);
        }
        queryFields[`${camelcase(entity.name)}ByPk`] = {
            type: entity,
            args: {
                id: {
                    type: pkType,
                },
            },
        };
    }
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
        }),
        types: [EntityOrderBy, EntitySelectColumn, EntityBoolExp],
    });
};
export const graphqlSelectionSetToPrismaInclude = (selectionSet, fields) => {
    if (!selectionSet) {
        return undefined;
    }
    const selections = selectionSet.selections.map((selection) => {
        if (selection.kind === Kind.FIELD) {
            const fieldSelection = selection;
            if (fieldSelection.selectionSet) {
                return {
                    [fieldSelection.name.value]: graphqlSelectionSetToPrismaInclude(fieldSelection.selectionSet, fields),
                };
            }
            return {};
        }
        return {};
    });
    const result = {};
    selections.forEach((selection) => {
        Object.entries(selection).forEach(([key, subinclude]) => {
            result[key] = Object.keys(subinclude || {}).length
                ? {
                    include: subinclude,
                }
                : true;
        });
    });
    Object.keys(result).forEach((key) => {
        if (fields.includes(key)) {
            delete result[key];
        }
    });
    return result;
};
export const graphqlInfoToPrismaInclude = (info, fields) => {
    const selectionSet = info.fieldNodes[0].selectionSet;
    if (!selectionSet) {
        return undefined;
    }
    return graphqlSelectionSetToPrismaInclude(selectionSet, fields);
};
export const graphqlWhereToPrismaWhere = (where) => {
    const prismaWhere = {};
    if (!where) {
        return {};
    }
    Object.keys(where).forEach((key) => {
        var _a, _b;
        if (key === '_or') {
            prismaWhere.OR = (_a = where._or) === null || _a === void 0 ? void 0 : _a.map((orWhere) => graphqlWhereToPrismaWhere(orWhere));
            return;
        }
        if (key === '_and') {
            prismaWhere.AND = (_b = where._and) === null || _b === void 0 ? void 0 : _b.map((andWhere) => graphqlWhereToPrismaWhere(andWhere));
            return;
        }
        if (key === '_not') {
            prismaWhere.NOT = graphqlWhereToPrismaWhere(where._not);
            return;
        }
        prismaWhere[key] = {};
        const fieldWhere = where[key];
        if (fieldWhere._gte) {
            prismaWhere[key].gte = fieldWhere._gte;
        }
        if (fieldWhere._gt) {
            prismaWhere[key].gt = fieldWhere._gt;
        }
        if (fieldWhere._in) {
            prismaWhere[key].in = fieldWhere._in;
        }
        if (fieldWhere._lte) {
            prismaWhere[key].lte = fieldWhere._lte;
        }
        if (fieldWhere._lt) {
            prismaWhere[key].lt = fieldWhere._lt;
        }
        if (fieldWhere._nin) {
            prismaWhere[key].notIn = fieldWhere._nin;
        }
        if (fieldWhere._eq) {
            prismaWhere[key].equals = fieldWhere._eq;
        }
        if (fieldWhere._neq) {
            prismaWhere[key].not = fieldWhere._neq;
        }
        if (fieldWhere._like || fieldWhere._ilike) {
            prismaWhere[key].contains = fieldWhere._like || fieldWhere._ilike;
            prismaWhere[key].mode = 'insensitive';
        }
    });
    return prismaWhere;
};
export const graphqlOrderByToPrismaOrderBy = (order) => {
    if (!order) {
        return undefined;
    }
    return order.map((orderBy) => {
        return Object.fromEntries(Object.entries(orderBy).map(([field, orderBy]) => {
            const order = orderBy;
            return [field, order.toLowerCase().startsWith('asc') ? 'asc' : 'desc'];
        }));
    });
};
export const graphqlInfoHasSelection = (fieldName, info) => {
    var _a;
    return (_a = info.fieldNodes[0].selectionSet) === null || _a === void 0 ? void 0 : _a.selections.find((selection) => {
        const field = selection;
        return field.name.value === fieldName;
    });
};