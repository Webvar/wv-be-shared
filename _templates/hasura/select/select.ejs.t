---
to: src/controllers/<%= name %>.ts
---
import {
  CustomError,
  loggerFactory,
  WVServiceContext,
  graphqlInfoToPrismaInclude,
  graphqlOrderByToPrismaOrderBy,
  graphqlWhereToPrismaWhere,
  PrismaWhere,
} from 'wv-be-shared';
import { GraphQLResolveInfo } from 'graphql';

import { initDb } from '../utils/init-db';
import { Prisma, PrismaClient } from '../types/generated/prisma';
import { <%= h.changeCase.pascal(name) %>, Me, Query<%= h.changeCase.pascal(name) %>Args } from '../types';

import <%= h.changeCase.pascal(name) %>ScalarFieldEnum = Prisma.<%= h.changeCase.pascal(name) %>ScalarFieldEnum;

const logger = loggerFactory(import.meta.url);

export const <%= h.changeCase.camel(name) %> = async (
  _: unknown,
  args: Query<%= h.changeCase.pascal(name) %>Args,
  context: WVServiceContext,
  info: GraphQLResolveInfo
): Promise<<%= h.changeCase.pascal(name) %>[] | null> => {
  const me = context.req.me as Me | undefined;

  const lg = logger.child({ function: '<%= h.changeCase.camel(name) %>', userId: me?.id });
  lg.debug({ step: 'start' });

  if (!me) {
    lg.warn({ step: 'authorizationError' });
    throw new CustomError('Authorization required');
  }

  const db: PrismaClient = await initDb();
  const instance = db.<%= prismaInstance %>;
  const fields = Object.keys(instance.fields);

  const include = graphqlInfoToPrismaInclude(info, fields);
  const where: Record<string, unknown> = graphqlWhereToPrismaWhere(
    args.where as PrismaWhere
  );
  const orderBy = graphqlOrderByToPrismaOrderBy(args.orderBy);

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

    await db.$disconnect();

    lg.debug({ step: 'finish', where, entitiesCount: entities.length });

    return entities as <%= h.changeCase.pascal(name) %>[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : undefined;

    lg.error({ step: 'findManyError', where, error: err, msg });

    await db.$disconnect();

    throw err;
  }
};