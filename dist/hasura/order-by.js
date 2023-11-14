import { GraphQLEnumType } from 'graphql';
const createOrderByEnum = (prefix = '') => new GraphQLEnumType({
    name: `${prefix}OrderBy`,
    description: 'column ordering options',
    values: {
        ASC: {
            description: 'in ascending order, nulls last',
        },
        ASC_NULLS_FIRST: {
            description: 'in ascending order, nulls first',
        },
        ASC_NULLS_LAST: {
            description: 'in ascending order, nulls last',
        },
        DESC: {
            description: 'in descending order, nulls first',
        },
        DESC_NULLS_FIRST: {
            description: 'in descending order, nulls first',
        },
        DESC_NULLS_LAST: {
            description: 'in descending order, nulls last',
        },
    },
});
export default createOrderByEnum;
