import { GraphQLResolveInfo } from 'graphql';
import { WVServiceContext } from '../middlewares/jwtMiddleware.js';
export declare const meMiddleware: (nextFunction: any) => (_: unknown, _args: Record<string, unknown>, context: WVServiceContext, _info: GraphQLResolveInfo, ...rest: unknown[]) => Promise<any>;
