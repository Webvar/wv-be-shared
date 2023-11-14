import { GraphQLEnumType, GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLScalarType, GraphQLSchema, GraphQLString, Kind, } from 'graphql';
import camelcase from 'camelcase';
import CustomError from '../helpers/CustomError.js';
import createOrderByEnum from './order-by.js';
import createComparisonExpInputObjectType from './comparison-exp.js';
export const createBaseTypes = (prefix = '', baseScalars) => {
    return new GraphQLSchema({
        types: [
            createOrderByEnum(prefix),
            ...baseScalars.map((scalar) => createComparisonExpInputObjectType('', scalar)),
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
const graphqlSelectionToPrismaInclude = (selectionSet) => {
    if (!selectionSet) {
        return undefined;
    }
    const selections = selectionSet.selections.map((selection) => {
        if (selection.kind === Kind.FIELD) {
            const fieldSelection = selection;
            if (fieldSelection.selectionSet) {
                return {
                    [fieldSelection.name.value]: graphqlSelectionToPrismaInclude(fieldSelection.selectionSet),
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
    return result;
};
const convertHasuraWhereToPrisma = (where) => {
    const hasuraWhere = where;
    const prismaWhere = {};
    prismaWhere['gte'] = hasuraWhere['_gte'];
    prismaWhere['gt'] = hasuraWhere['_gt'];
    prismaWhere['in'] = hasuraWhere['_in'];
    prismaWhere['lte'] = hasuraWhere['_lte'];
    prismaWhere['lt'] = hasuraWhere['_lt'];
    prismaWhere['notIn'] = hasuraWhere['_nin'];
    prismaWhere['equals'] = hasuraWhere['_eq'];
    return prismaWhere;
};
export const createResolvers = (entityName, dbPath, 
/* eslint-disable */
initDb) => {
    const key = `${entityName.toLowerCase()[0]}${entityName.slice(1)}`;
    const getMany = async (_, args, context, info) => {
        var _a;
        const me = context.req.me;
        if (!me) {
            throw new CustomError('Authorization required');
        }
        const db = await initDb();
        const instance = db[dbPath];
        const include = graphqlSelectionToPrismaInclude(info.fieldNodes[0].selectionSet);
        if (include) {
            Object.keys(include).forEach((key) => {
                if (instance.fields[key]) {
                    delete include[key];
                }
            });
        }
        const where = {};
        if (args.where) {
            Object.entries(args.where).forEach(([key, filter]) => {
                if (key !== '_not' && key !== '_or' && key !== '_and') {
                    where[key] = convertHasuraWhereToPrisma(filter);
                }
            });
        }
        const entities = await instance.findMany({
            take: args.limit,
            skip: args.offset,
            where,
            distinct: args.distinctOn,
            include,
            orderBy: (_a = args.orderBy) === null || _a === void 0 ? void 0 : _a.map((orderBy) => {
                return Object.fromEntries(Object.entries(orderBy).map(([field, order]) => {
                    const orderBy = order;
                    return [
                        field,
                        orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
                    ];
                }));
            }),
        });
        await db.$disconnect();
        return entities;
    };
    const getAggregate = async (_, args, context, info) => {
        var _a, _b, _c, _d;
        const me = context.req.me;
        if (!me) {
            throw new CustomError('Authorization required');
        }
        const db = await initDb();
        const instance = db[dbPath];
        const where = {};
        if (args.where) {
            Object.entries(args.where).forEach(([key, filter]) => {
                if (key !== '_not' && key !== '_or' && key !== '_and') {
                    where[key] = convertHasuraWhereToPrisma(filter);
                }
            });
        }
        const result = {
            nodes: [],
            aggregate: {
                count: 0,
            },
        };
        if ((_a = info.fieldNodes[0].selectionSet) === null || _a === void 0 ? void 0 : _a.selections.find((selection) => {
            const field = selection;
            return field.name.value === 'aggregate';
        })) {
            const { _count } = await instance.aggregate({
                _count: true,
                take: args.limit,
                skip: args.offset,
                where,
                orderBy: (_b = args.orderBy) === null || _b === void 0 ? void 0 : _b.map((orderBy) => {
                    return Object.fromEntries(Object.entries(orderBy).map(([field, order]) => {
                        const orderBy = order;
                        return [
                            field,
                            orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
                        ];
                    }));
                }),
            });
            result.aggregate.count = _count;
        }
        const nodes = (_c = info.fieldNodes[0].selectionSet) === null || _c === void 0 ? void 0 : _c.selections.find((selection) => {
            const field = selection;
            return field.name.value === 'nodes';
        });
        if (nodes) {
            const include = graphqlSelectionToPrismaInclude(nodes.selectionSet);
            if (include) {
                Object.keys(include).forEach((key) => {
                    if (instance.fields[key]) {
                        delete include[key];
                    }
                });
            }
            const entities = await instance.findMany({
                take: args.limit,
                skip: args.offset,
                where,
                distinct: args.distinctOn,
                include,
                orderBy: (_d = args.orderBy) === null || _d === void 0 ? void 0 : _d.map((orderBy) => {
                    return Object.fromEntries(Object.entries(orderBy).map(([field, order]) => {
                        const orderBy = order;
                        return [
                            field,
                            orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
                        ];
                    }));
                }),
            });
            result.nodes = entities;
        }
        await db.$disconnect();
        return result;
    };
    const getOne = async (_, args, context, info) => {
        const me = context.req.me;
        if (!me) {
            throw new CustomError('Authorization required');
        }
        const db = await initDb();
        const instance = db[dbPath];
        const include = graphqlSelectionToPrismaInclude(info.fieldNodes[0].selectionSet);
        if (include) {
            Object.keys(include).forEach((key) => {
                if (instance.fields[key]) {
                    delete include[key];
                }
            });
        }
        const entity = await instance.findFirst({
            where: args,
            include,
        });
        await db.$disconnect();
        return entity;
    };
    return {
        Query: {
            [key]: getMany,
            [`${key}ByPk`]: getOne,
            [`${key}Aggregate`]: getAggregate,
        },
    };
};
