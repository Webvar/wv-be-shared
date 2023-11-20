---
sh: "npx generate-hasura-schema <%= name %> <%= path || `schemas/${name}.graphql` %> <%= resolvers || 'select,selectByPk,selectAggregate' %>"
---
