#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { GraphQLScalarType, printSchema } from 'graphql';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { createSchema, createBaseTypes, SchemaResolverType } from '../hasura/index.js';
const HASURA_WITHOUT_PREFIX = '';
const name = process.argv[process.argv.length - 3];
const schemaPath = process.argv[process.argv.length - 2];
const resolvers = process.argv[process.argv.length - 1];
const schema = loadSchemaSync(schemaPath || `schemas/${name}.graphql`, {
    loaders: [new GraphQLFileLoader()],
});
const GraphQLType = schema.getType(name);
const baseTypes = createBaseTypes(HASURA_WITHOUT_PREFIX, Object.values(schema.getTypeMap()).filter((definition) => definition instanceof GraphQLScalarType));
const generatorResolvers = [];
if (resolvers.includes('select')) {
    generatorResolvers.push(SchemaResolverType.GET_MANY);
}
if (resolvers.includes('selectByPk')) {
    generatorResolvers.push(SchemaResolverType.GET_BY_PK);
}
if (resolvers.includes('selectAggregate')) {
    generatorResolvers.push(SchemaResolverType.GET_AGGREGATE);
}
const typeSchema = createSchema(HASURA_WITHOUT_PREFIX, baseTypes, GraphQLType, 'id', generatorResolvers);
writeFileSync(schemaPath || `schemas/${name}.graphql`, printSchema(typeSchema));
