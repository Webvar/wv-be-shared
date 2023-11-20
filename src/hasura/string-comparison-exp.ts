import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

const createComparisonExpStringType = (
  prefix = '',
) =>
  new GraphQLInputObjectType({
    name: `${prefix}StringComparisonExp`,
    description: `Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'.`,
    fields: {
      _eq: { type: GraphQLString },
      _gt: { type: GraphQLString },
      _gte: { type: GraphQLString },
      _in: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      _isNull: { type: GraphQLBoolean },
      _lt: { type: GraphQLString },
      _lte: { type: GraphQLString},
      _neq: { type: GraphQLString },
      _nin: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      _ilike: { type: GraphQLString },
      _like: { type: GraphQLString },
    },
  });

export default createComparisonExpStringType;
