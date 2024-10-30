import loggerFactory from '../helpers/logger.js';
const logger = loggerFactory('file:///middlewares/me.middleware.ts');
export const meMiddleware = (nextFunction) => async (_, _args, context, _info, ...rest) => {
    const me = context.req.me;
    const lg = logger.child({ function: 'meMiddleware', userId: me === null || me === void 0 ? void 0 : me.id });
    lg.debug({ step: 'start_verification' });
    if (!me) {
        lg.warn({ step: 'authorizationError' });
        throw new Error('Authorization required');
    }
    const roles = Array.isArray(me.roles)
        ? me.roles.filter((role) => typeof role === 'string')
        : [];
    const isAdmin = !!roles.find((role) => role === 'Administrator');
    context.req.isAdmin = isAdmin;
    lg.debug({ step: 'identify_verification_finished' });
    return nextFunction(_, _args, context, _info, ...rest);
};
