import {
  FieldNode,
  GraphQLEnumType,
  GraphQLEnumValueConfig,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
  SelectionNode,
  SelectionSetNode,
} from 'graphql';
import camelcase from 'camelcase';

import { WVServiceContext } from '../middlewares/jwtMiddleware.js';
import CustomError from '../helpers/CustomError.js';

import createOrderByEnum from './order-by.js';
import createComparisonExpInputObjectType from './comparison-exp.js';
import type { HasuraCrudResolversQuery } from './types/resolvers';
import type {
  HasuraCrudDataType,
  HasuraCrudDataTypeRelationships,
  HasuraCrudPrimitive,
} from './types/common';
import type {
  HasuraCrudInputComparisonExp,
  HasuraCrudInputStringComparisonExp,
  HasuraCrudOrderBy,
  HasuraCrudQueryGetManyArgs,
  HasuraCrudQueryGetAggregateArgs,
  HasuraCrudQueryGetOneArgs,
} from './types/inputs';

export const createBaseTypes = (
  prefix = '',
  baseScalars: GraphQLScalarType[]
) => {
  return new GraphQLSchema({
    types: [
      createOrderByEnum(prefix),
      ...baseScalars.map((scalar) =>
        createComparisonExpInputObjectType('', scalar)
      ),
    ],
  });
};

const convertScalarToComparisonExp = (
  prefix = '',
  baseTypes: GraphQLSchema,
  scalar: GraphQLScalarType
) => {
  prefix =
    scalar.name === GraphQLString.name ||
    scalar.name === GraphQLInt.name ||
    scalar.name === GraphQLID.name
      ? prefix
      : '';
  const comparisonExp = baseTypes.getType(
    `${prefix}${scalar.name}ComparisonExp`
  );
  if (comparisonExp) {
    return comparisonExp;
  }

  return baseTypes.getType(`${prefix}${GraphQLString.name}ComparisonExp`);
};

export enum SchemaResolverType {
  GET_MANY = 'getMany',
  GET_AGGREGATE = 'getAggregate',
  GET_BY_PK = 'getByPK',
}

const schemaResolverTypes = [
  SchemaResolverType.GET_MANY,
  SchemaResolverType.GET_AGGREGATE,
  SchemaResolverType.GET_BY_PK,
];

export const createSchema = (
  prefix = '',
  baseTypes: GraphQLSchema,
  entity: GraphQLInterfaceType | GraphQLObjectType,
  pkField = 'id',
  resolvers: SchemaResolverType[] = schemaResolverTypes
) => {
  const OrderBy = baseTypes.getType(`${prefix}OrderBy`) as GraphQLEnumType;

  const EntitySelectColumn = new GraphQLEnumType({
    name: `${entity.name}SelectColumn`,
    description: `select columns of table "${entity.name.toLowerCase()}"`,
    values: Object.fromEntries(
      Object.keys(entity.getFields()).map(
        (field): [string, GraphQLEnumValueConfig] => {
          return [
            field,
            {
              value: field,
              description: 'column name',
            },
          ];
        }
      )
    ),
  });

  const EntityOrderBy = new GraphQLInputObjectType({
    name: `${entity.name}OrderBy`,
    description: `Ordering options when selecting data from "${entity.name.toLowerCase()}".`,
    fields: Object.fromEntries(
      Object.keys(entity.getFields()).map(
        (field): [string, GraphQLInputFieldConfig] => {
          return [
            field,
            {
              type: OrderBy,
            },
          ];
        }
      )
    ),
  });

  const EntityBoolExp: GraphQLInputObjectType = new GraphQLInputObjectType({
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
      ...Object.fromEntries(
        Object.entries(entity.getFields())
          .map(([field, definition]): [string, GraphQLInputFieldConfig] => {
            let definitionType = definition.type;
            if (definitionType instanceof GraphQLNonNull) {
              definitionType = definitionType.ofType;
            }
            if (!(definitionType instanceof GraphQLScalarType)) {
              return [field, null as unknown as GraphQLInputFieldConfig];
            }

            const type = convertScalarToComparisonExp(
              prefix,
              baseTypes,
              definitionType
            ) as GraphQLScalarType;
            return [
              field,
              {
                type,
              },
            ];
          })
          .filter(([, definition]) => !!definition)
      ),
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
  })

  const queryFields: Record<string, GraphQLFieldConfig<unknown, unknown>> = {};

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
    let pkType = entity.getFields()[pkField]!.type as
      | GraphQLScalarType
      | GraphQLNonNull<GraphQLScalarType>;
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

const graphqlSelectionToPrismaInclude = (
  selectionSet: SelectionSetNode | undefined
): Record<string, unknown> | undefined => {
  if (!selectionSet) {
    return undefined;
  }

  const selections = selectionSet.selections.map((selection: SelectionNode) => {
    if (selection.kind === Kind.FIELD) {
      const fieldSelection = selection as FieldNode;
      if (fieldSelection.selectionSet) {
        return {
          [fieldSelection.name.value]: graphqlSelectionToPrismaInclude(
            fieldSelection.selectionSet
          ),
        };
      }
      return {};
    }
    return {};
  });

  const result: Record<string, unknown> = {};
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

const convertHasuraWhereToPrisma = <T extends HasuraCrudPrimitive>(
  where: HasuraCrudInputComparisonExp<T>
) => {
  const hasuraWhere: HasuraCrudInputStringComparisonExp =
    where as HasuraCrudInputStringComparisonExp;
  const prismaWhere: Record<string, unknown> = {};

  prismaWhere['gte'] = hasuraWhere['_gte'];
  prismaWhere['gt'] = hasuraWhere['_gt'];
  prismaWhere['in'] = hasuraWhere['_in'];
  prismaWhere['lte'] = hasuraWhere['_lte'];
  prismaWhere['lt'] = hasuraWhere['_lt'];
  prismaWhere['notIn'] = hasuraWhere['_nin'];
  prismaWhere['equals'] = hasuraWhere['_eq'];

  return prismaWhere;
};

export const createResolvers = <
  T extends HasuraCrudDataType<
    unknown,
    string,
    HasuraCrudDataTypeRelationships
  >,
  C,
  Me
>(
  entityName: string,
  dbPath: string,
  /* eslint-disable */
  initDb: () => Promise<any>,
): { Query: HasuraCrudResolversQuery<T, C> } => {
  const key = `${entityName.toLowerCase()[0]}${entityName.slice(
    1
  )}` as Uncapitalize<T['name']>;

  const getMany = async (
    _: unknown,
    args: HasuraCrudQueryGetManyArgs<T>,
    context: WVServiceContext,
    info: GraphQLResolveInfo
  ) => {
    const me = context.req.me as Me;

    if (!me) {
      throw new CustomError('Authorization required');
    }

    const db = await initDb();
    const instance = db[dbPath];

    const include = graphqlSelectionToPrismaInclude(
      info.fieldNodes[0].selectionSet
    );

    if (include) {
      Object.keys(include).forEach((key) => {
        if (instance.fields[key as keyof typeof instance.fields]) {
          delete include[key];
        }
      });
    }

    const where: Record<string, unknown> = {};
    if (args.where) {
      Object.entries(args.where).forEach(([key, filter]) => {
        if (key !== '_not' && key !== '_or' && key !== '_and') {
          where[key] = convertHasuraWhereToPrisma(
            filter as HasuraCrudInputStringComparisonExp
          );
        }
      });
    }

    const entities = await instance.findMany({
      take: args.limit,
      skip: args.offset,
      where,
      distinct: args.distinctOn,
      include,
      orderBy: args.orderBy?.map((orderBy) => {
        return Object.fromEntries(
          Object.entries(orderBy).map(([field, order]) => {
            const orderBy = order as unknown as HasuraCrudOrderBy;
            return [
              field,
              orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
            ];
          })
        );
      }),
    });

    await db.$disconnect();

    return entities;
  };

  const getAggregate = async (
    _: unknown,
    args: HasuraCrudQueryGetAggregateArgs<T>,
    context: WVServiceContext,
    info: GraphQLResolveInfo
  ) => {
    const me = context.req.me as Me;

    if (!me) {
      throw new CustomError('Authorization required');
    }

    const db = await initDb();
    const instance = db[dbPath];

    const where: Record<string, unknown> = {};
    if (args.where) {
      Object.entries(args.where).forEach(([key, filter]) => {
        if (key !== '_not' && key !== '_or' && key !== '_and') {
          where[key] = convertHasuraWhereToPrisma(
            filter as HasuraCrudInputStringComparisonExp
          );
        }
      });
    }

    const result = {
      nodes: [],
      aggregate: {
        count: 0,
      },
    };

    if (info.fieldNodes[0].selectionSet?.selections.find((selection) => {
      const field = selection as FieldNode;

      return field.name.value === 'aggregate';
    })) {
      const { _count } = await instance.aggregate({
        _count: true,
        take: args.limit,
        skip: args.offset,
        where,
        orderBy: args.orderBy?.map((orderBy) => {
          return Object.fromEntries(
            Object.entries(orderBy).map(([field, order]) => {
              const orderBy = order as unknown as HasuraCrudOrderBy;
              return [
                field,
                orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
              ];
            })
          );
        }),
      });

      result.aggregate.count = _count;
    }
    const nodes = info.fieldNodes[0].selectionSet?.selections.find((selection) => {
      const field = selection as FieldNode;

      return field.name.value === 'nodes';
    }) as FieldNode;
    if (nodes) {
      const include = graphqlSelectionToPrismaInclude(
        nodes.selectionSet,
      );

      if (include) {
        Object.keys(include).forEach((key) => {
          if (instance.fields[key as keyof typeof instance.fields]) {
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
        orderBy: args.orderBy?.map((orderBy) => {
          return Object.fromEntries(
            Object.entries(orderBy).map(([field, order]) => {
              const orderBy = order as unknown as HasuraCrudOrderBy;
              return [
                field,
                orderBy.toLowerCase().startsWith('asc') ? 'asc' : 'desc',
              ];
            })
          );
        }),
      });
      result.nodes = entities;
    }

    await db.$disconnect();

    return result;
  };

  const getOne = async (
    _: unknown,
    args: HasuraCrudQueryGetOneArgs<T>,
    context: WVServiceContext,
    info: GraphQLResolveInfo
  ) => {
    const me = context.req.me as Me;

    if (!me) {
      throw new CustomError('Authorization required');
    }

    const db = await initDb();
    const instance = db[dbPath];

    const include = graphqlSelectionToPrismaInclude(
      info.fieldNodes[0].selectionSet
    );

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
    } as HasuraCrudResolversQuery<T, C>,
  };
};
