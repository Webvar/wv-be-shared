export { companyMiddleware } from './company.middleware.js';
export { meMiddleware } from './me.middleware.js';
export declare const extendAuth: (nextFunction: any) => (_: unknown, _args: Record<string, unknown>, context: import("./jwtMiddleware.js").WVServiceContext, _info: import("graphql").GraphQLResolveInfo, ...rest: unknown[]) => Promise<any>;
