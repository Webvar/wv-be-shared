import { graphqlWhereToPrismaWhere } from './../src/hasura/index';

describe('graphqlWhereToPrismaWhere', () => {
  it('should return an empty prismaWhere object if no where condition is provided', () => {
    const result = graphqlWhereToPrismaWhere(undefined);
    expect(result).toEqual({ prismaWhere: {} });
  });

  it('should handle _or conditions correctly', () => {
    const where = {
      _or: [
        { name: { _eq: 'Test' } },
        { age: { _gte: 30 } }
      ]
    };

    const expected = {
      prismaWhere: {
        OR: [
          { name: { equals: 'Test' } },
          { age: { gte: 30 } }
        ]
      }
    };

    const result = graphqlWhereToPrismaWhere(where);
    expect(result).toEqual(expected);
  });

  it('should handle _and conditions correctly', () => {
    const where = {
      _and: [
        { name: { _eq: 'Test' } },
        { age: { _gte: 30 } }
      ]
    };

    const expected = {
      prismaWhere: {
        AND: [
          { name: { equals: 'Test' } },
          { age: { gte: 30 } }
        ]
      }
    };

    const result = graphqlWhereToPrismaWhere(where);
    expect(result).toEqual(expected);
  });

  it('should handle _not conditions correctly', () => {
    const where = {
      _not: { name: { _eq: 'Test' } }
    };

    const expected = {
      prismaWhere: {
        NOT: { name: { equals: 'Test' } }
      }
    };

    const result = graphqlWhereToPrismaWhere(where);
    expect(result).toEqual(expected);
  });

  it('should handle various field comparisons correctly', () => {
    const where = {
      age: { _gt: 20, _lt: 30, _eq: 25 },
      name: { _like: 'Tes%', _neq: 'Tester' },
    };

    const expected = {
      prismaWhere: {
        age: { gt: 20, lt: 30, equals: 25 },
        name: { contains: 'Tes%', mode: 'insensitive', not: 'Tester' },
      }
    };

    const result = graphqlWhereToPrismaWhere(where);
    expect(result).toEqual(expected);
  });

  it('should handle full text search correctly', () => {
    const where = {
      name: { _fts: 'searchTerm' },
    };

    const expected = {
      prismaWhere: {},
      fullTextSearch: 'searchTerm',
    };

    const result = graphqlWhereToPrismaWhere(where);
    expect(result).toEqual(expected);
  });
});