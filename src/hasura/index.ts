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

import createOrderByEnum from './order-by.js';
import createComparisonExpInputObjectType from './comparison-exp.js';
import createComparisonExpStringType from './string-comparison-exp.js';
import type {
  HasuraCrudDataType,
} from './types/common';
import type {
  HasuraCrudInputStringComparisonExp,
  HasuraCrudOrderBy,
  HasuraCrudInputBoolExp,
} from './types/inputs';

export const createBaseTypes = (
  prefix = '',
  baseScalars: GraphQLScalarType[]
) => {
  return new GraphQLSchema({
    types: [
      createOrderByEnum(prefix),
      ...baseScalars.map((scalar) =>
        scalar.name === 'String' ? createComparisonExpStringType() : createComparisonExpInputObjectType('', scalar)
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

export const graphqlSelectionSetToPrismaInclude = (
  selectionSet: SelectionSetNode | undefined | null,
  fields: string[]
) => {
  if (!selectionSet) {
    return undefined;
  }

  const selections = selectionSet.selections.map((selection: SelectionNode) => {
    if (selection.kind === Kind.FIELD) {
      const fieldSelection = selection as FieldNode;
      if (fieldSelection.selectionSet) {
        return {
          [fieldSelection.name.value]: graphqlSelectionSetToPrismaInclude(
            fieldSelection.selectionSet,
            fields
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

  Object.keys(result).forEach((key) => {
    if (fields.includes(key)) {
      delete result[key];
    }
  });

  return result;
};

export const graphqlInfoToPrismaInclude = (
  info: GraphQLResolveInfo,
  fields: string[]
) => {
  const selectionSet = info.fieldNodes[0].selectionSet;
  if (!selectionSet) {
    return undefined;
  }

  return graphqlSelectionSetToPrismaInclude(selectionSet, fields);
};

export type PrismaWhere = {
  OR?: PrismaWhere[];
  AND?: PrismaWhere[];
  NOT?: PrismaWhere;
} & Record<string, Record<string, unknown>>;

export const graphqlWhereToPrismaWhere = (
  where?: HasuraCrudInputBoolExp<HasuraCrudDataType<unknown, never>>
): { prismaWhere: PrismaWhere; fullTextSearch?: string } => {
  const prismaWhere: PrismaWhere = {};
  let fullTextSearch: string | undefined;

  if (!where) {
    return { prismaWhere: {} };
  }

  Object.keys(where).forEach((key) => {
    if (key === '_or') {
      prismaWhere.OR = where._or?.map(
        (orWhere) => graphqlWhereToPrismaWhere(orWhere).prismaWhere
      );
      return;
    }
    if (key === '_and') {
      prismaWhere.AND = where._and?.map(
        (andWhere) => graphqlWhereToPrismaWhere(andWhere).prismaWhere
      );
      return;
    }
    if (key === '_not') {
      prismaWhere.NOT = graphqlWhereToPrismaWhere(where._not!).prismaWhere;
      return;
    }

    prismaWhere[key] = {};
    const fieldWhere = where[key] as HasuraCrudInputStringComparisonExp;
    if (fieldWhere._gte !== undefined) {
      prismaWhere[key].gte = fieldWhere._gte;
    }
    if (fieldWhere._gt !== undefined) {
      prismaWhere[key].gt = fieldWhere._gt;
    }
    if (fieldWhere._in !== undefined) {
      prismaWhere[key].in = fieldWhere._in;
    }
    if (fieldWhere._lte !== undefined) {
      prismaWhere[key].lte = fieldWhere._lte;
    }
    if (fieldWhere._lt !== undefined) {
      prismaWhere[key].lt = fieldWhere._lt;
    }
    if (fieldWhere._nin !== undefined) {
      prismaWhere[key].notIn = fieldWhere._nin;
    }
    if (fieldWhere._eq !== undefined) {
      prismaWhere[key].equals = fieldWhere._eq;
    }
    if (fieldWhere._neq !== undefined) {
      prismaWhere[key].not = fieldWhere._neq;
    }
    if (fieldWhere._like !== undefined || fieldWhere._ilike !== undefined) {
      prismaWhere[key].contains = fieldWhere._like || fieldWhere._ilike;
      prismaWhere[key].mode = 'insensitive';
    }
    if(fieldWhere._has !== undefined) {
      prismaWhere[key].has = fieldWhere._has
    }
    if (fieldWhere._fts !== undefined) {
      fullTextSearch = fieldWhere._fts;
      return;
    }
  });

  Object.keys(prismaWhere).forEach((key) => {
    if (Object.keys(prismaWhere[key]).length === 0) {
      delete prismaWhere[key];
    }
  });

  return { prismaWhere, fullTextSearch };
};

export const graphqlOrderByToPrismaOrderBy = (
  order?: Record<string, unknown>[] | null
) => {
  if (!order) {
    return undefined;
  }

  return order.map((orderBy) => {
    return Object.fromEntries(
      Object.entries(orderBy).map(([field, orderBy]) => {
        const order = orderBy as HasuraCrudOrderBy;
        return [field, order.toLowerCase().startsWith('asc') ? 'asc' : 'desc'];
      })
    );
  });
};

export const graphqlInfoHasSelection = (
  fieldName: string,
  info: GraphQLResolveInfo
): FieldNode | undefined => {
  return info.fieldNodes[0].selectionSet?.selections.find((selection) => {
    const field = selection as FieldNode;

    return field.name.value === fieldName;
  }) as FieldNode;
};
