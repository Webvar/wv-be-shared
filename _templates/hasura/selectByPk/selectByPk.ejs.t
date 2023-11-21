---
to: src/controllers/<%= name %>ByPk.ts
---
import {
  CustomError,
  loggerFactory,
  WVServiceContext,
  graphqlInfoToPrismaInclude,
} from 'wv-be-shared';
import { GraphQLResolveInfo } from 'graphql';

import { initDb } from '../utils/init-db';
import { PrismaClient } from '../types/generated/prisma';
import { <%= h.changeCase.pascal(name) %>, Me, Query<%= h.changeCase.pascal(name) %>ByPkArgs } from '../types';

const logger = loggerFactory(import.meta.url);

export const <%= h.changeCase.camel(name) %>ByPk = async (
  _: unknown,
  args: Query<%= h.changeCase.pascal(name) %>ByPkArgs,
  context: WVServiceContext,
  info: GraphQLResolveInfo
): Promise<<%= h.changeCase.pascal(name) %> | null> => {
  const me = context.req.me as Me | undefined;

  const lg = logger.child({ function: '<%= h.changeCase.camel(name) %>ByPk', userId: me?.id });
  lg.debug({ step: 'start' });

  if (!me) {
    lg.warn({ step: 'authorizationError' });
    throw new CustomError('Authorization required');
  }

  const db: PrismaClient = await initDb();
  const instance = db.<%= prismaInstance %>;
  const fields = Object.keys(instance.fields);

  const include = graphqlInfoToPrismaInclude(info, fields);

  lg.debug({ step: 'findFirstQuery', id: args.id });

  try {
    const entity = await instance.findFirst({
      where: args,
      include,
    });

    await db.$disconnect();

    if (!entity) {
      lg.warn({ step: 'findFirstEmptyResult', id: args.id });

      return null;
    }

    lg.debug({ step: 'finish', entity });

    return entity as <%= h.changeCase.pascal(name) %>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : undefined;

    lg.error({ step: 'findFirstError', id: args.id, error: err, msg });

    await db.$disconnect();

    throw err;
  }
};