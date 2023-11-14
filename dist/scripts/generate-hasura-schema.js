#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { GraphQLScalarType, printSchema } from 'graphql';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { createSchema, createBaseTypes } from '../hasura/index.js';
const HASURA_WITHOUT_PREFIX = '';
const name = process.argv[process.argv.length - 2];
const schemasDir = process.argv[process.argv.length - 1];
const schema = loadSchemaSync(`${schemasDir}/schema.graphql`, {
    loaders: [new GraphQLFileLoader()],
});
const GraphQLType = schema.getType(name);
const baseTypes = createBaseTypes(HASURA_WITHOUT_PREFIX, Object.values(schema.getTypeMap()).filter((definition) => definition instanceof GraphQLScalarType));
const typeSchema = createSchema(HASURA_WITHOUT_PREFIX, baseTypes, GraphQLType);
writeFileSync(`${schemasDir}/${name}.graphql`, printSchema(typeSchema));
