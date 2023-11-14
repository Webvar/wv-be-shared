import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
} from 'graphql';

const createComparisonExpInputObjectType = (
  prefix = '',
  type: GraphQLScalarType
) =>
  new GraphQLInputObjectType({
    name: `${prefix}${type.name}ComparisonExp`,
    description: `Boolean expression to compare columns of type "${type.name}". All fields are combined with logical 'AND'.`,
    fields: {
      _eq: { type },
      _gt: { type },
      _gte: { type },
      _in: { type: new GraphQLList(new GraphQLNonNull(type)) },
      _isNull: { type: GraphQLBoolean },
      _lt: { type },
      _lte: { type },
      _neq: { type },
      _nin: { type: new GraphQLList(new GraphQLNonNull(type)) },
    },
  });

export default createComparisonExpInputObjectType;
