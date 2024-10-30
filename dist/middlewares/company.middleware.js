import { loggerFactory } from '../../src/index';
const logger = loggerFactory('file:///middlewares/company.middleware.ts');
export const companyMiddleware = (nextFunction) => async (_, args, context, _info, ...rest) => {
    var _a;
    const me = context.req.me;
    const isAdmin = context.req.isAdmin;
    const meCompanyId = me === null || me === void 0 ? void 0 : me.companyId;
    const inputCompanyId = (_a = args.input) === null || _a === void 0 ? void 0 : _a.companyId;
    let companyId;
    if (isAdmin && inputCompanyId) {
        companyId = inputCompanyId;
    }
    else if (meCompanyId) {
        companyId = meCompanyId;
    }
    const lg = logger.child({
        function: 'companyMiddleware',
        userId: me === null || me === void 0 ? void 0 : me.id,
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
