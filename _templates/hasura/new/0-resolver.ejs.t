---
to: src/generated/hasura/resolvers/<%= name %>.ts
---
<%
    entityName = h.changeCase.pascal(name);
    dbPath = h.changeCase.camel(name);
%>import { WVServiceContext, createResolvers } from 'wv-be-shared';
import { HasuraCrudDataType } from 'wv-be-shared/dist/hasura/types/common';

import { <%= entityName %>, Me } from '../../../types';
import { initDb } from '../../../utils/init-db';

type AgreementHasuraType = HasuraCrudDataType<<%= entityName %>, '<%= entityName %>'>;

const resolvers = createResolvers<AgreementHasuraType, WVServiceContext, Me>(
  '<%= entityName %>',
  '<%= dbPath %>',
  () => initDb(),
);

export const { Query } = resolvers;
