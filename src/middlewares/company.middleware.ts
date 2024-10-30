/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLResolveInfo } from 'graphql';
import { WVServiceContext, loggerFactory } from '../../src/index';

import { Me } from '../../src/types/common';

const logger = loggerFactory('file:///middlewares/company.middleware.ts');

export const companyMiddleware =
  (nextFunction: any) =>
  async (
    _: unknown,
    args: Record<string, any>,
    context: WVServiceContext,
    _info: GraphQLResolveInfo,
    ...rest: unknown[]
  ) => {
    const me = context.req.me as Me | undefined;
    const isAdmin = context.req.isAdmin;
    const meCompanyId = me?.companyId as string | undefined;
    const inputCompanyId = args.input?.companyId;

    let companyId: string | undefined;

    if (isAdmin && inputCompanyId) {
      companyId = inputCompanyId;
    } else if (meCompanyId) {
      companyId = meCompanyId;
    }

    const lg = logger.child({
      function: 'companyMiddleware',
      userId: me?.id,
      companyId,
      isAdmin,
    });
    lg.debug({ step: 'start_verification' });

    if (!isAdmin && !companyId) {
      lg.warn({ step: 'authorizationError' });
      throw new Error('Missing company');
    }

    lg.debug({ step: 'company_verification_finished' });

    return nextFunction(_, args, context, _info, ...rest);
  };
