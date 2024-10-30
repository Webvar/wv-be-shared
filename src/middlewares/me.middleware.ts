/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLResolveInfo } from 'graphql';
import { WVServiceContext, loggerFactory } from './../index';

import { Me } from '../../src/types/common';

const logger = loggerFactory('file:///middlewares/me.middleware.ts');

export const meMiddleware =
  (nextFunction: any) =>
    async (
      _: unknown,
      _args: Record<string, unknown>,
      context: WVServiceContext,
      _info: GraphQLResolveInfo,
      ...rest: unknown[]
    ) => {
      const me = context.req.me as Me | undefined;

      const lg = logger.child({ function: 'meMiddleware', userId: me?.id });
      lg.debug({ step: 'start_verification' });

      if (!me) {
        lg.warn({ step: 'authorizationError' });
        throw new Error('Authorization required');
      }

      const roles: string[] = Array.isArray(me.roles)
        ? me.roles.filter((role): role is string => typeof role === 'string')
        : [];

      const isAdmin = !!roles.find((role) => role === 'Administrator');
      context.req.isAdmin = isAdmin;

      lg.debug({ step: 'identify_verification_finished' });

      return nextFunction(_, _args, context, _info, ...rest);
    };
