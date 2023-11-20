---
to: src/controllers/<%= name %>Aggregate.ts
---
import {
  CustomError,
  loggerFactory,
  WVServiceContext,
  graphqlInfoHasSelection,
  graphqlSelectionSetToPrismaInclude,
  graphqlOrderByToPrismaOrderBy,
  graphqlWhereToPrismaWhere,
  PrismaWhere,
} from 'wv-be-shared';
import { GraphQLResolveInfo } from 'graphql';

import { initDb } from '../utils/init-db';
import { Prisma, PrismaClient } from '../types/generated/prisma';
import {
  <%= h.changeCase.pascal(name) %>,
  <%= h.changeCase.pascal(name) %>Aggregate,
  Me,
  Query<%= h.changeCase.pascal(name) %>AggregateArgs,
} from '../types';

import <%= h.changeCase.pascal(name) %>ScalarFieldEnum = Prisma.<%= h.changeCase.pascal(name) %>ScalarFieldEnum;

const logger = loggerFactory(import.meta.url);

export const <%= h.changeCase.camel(name) %>Aggregate = async (
  _: unknown,
  args: Query<%= h.changeCase.pascal(name) %>AggregateArgs,
  context: WVServiceContext,
  info: GraphQLResolveInfo
): Promise<<%= h.changeCase.pascal(name) %>Aggregate> => {
  const me = context.req.me as Me | undefined;

  const lg = logger.child({ function: '<%= h.changeCase.camel(name) %>Aggregate', userId: me?.id });
  lg.debug({ step: 'start' });

  if (!me) {
    lg.warn({ step: 'authorizationError' });
    throw new CustomError('Authorization required');
  }

  const db: PrismaClient = await initDb();
  const instance = db.<%= prismaInstance %>;
  const fields = Object.keys(instance.fields);

  const where: Record<string, unknown> = graphqlWhereToPrismaWhere(
    args.where as PrismaWhere
  );
  const orderBy = graphqlOrderByToPrismaOrderBy(args.orderBy);

  const result = {
    nodes: [] as <%= h.changeCase.pascal(name) %>[],
    aggregate: {
      count: 0,
    },
  };

  if (graphqlInfoHasSelection('aggregate', info)) {
    lg.debug({ step: 'aggregateQuery', where });

    try {
      const { _count } = await instance.aggregate({
        _count: true,
        where,
      });

      result.aggregate.count = _count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;

      lg.error({ step: 'aggregateQueryError', where, error: err, msg });

      throw err;
    }
  }

  const nodesSelection = graphqlInfoHasSelection('nodes', info);
  if (nodesSelection) {
    const include = graphqlSelectionSetToPrismaInclude(
      nodesSelection.selectionSet!,
      fields
    );

    lg.debug({ step: 'findManyQuery', where });

    try {
      const entities = await instance.findMany({
        take: args.limit || undefined,
        skip: args.offset || undefined,
        where,
        distinct: args.distinctOn as <%= h.changeCase.pascal(name) %>ScalarFieldEnum,
        include,
        orderBy,
      });

      result.nodes = entities as <%= h.changeCase.pascal(name) %>[];

      lg.debug({
        step: 'finish',
        where,
        aggregateCount: result.aggregate.count,
        entitiesCount: entities.length,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;

      lg.error({ step: 'findManyError', where, error: err, msg });

      throw err;
    }
  }

  await db.$disconnect();

  return result;
};