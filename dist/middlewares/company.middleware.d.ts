import { GraphQLResolveInfo } from 'graphql';
import { WVServiceContext } from '../middlewares/jwtMiddleware.js';
export declare const companyMiddleware: (nextFunction: any) => (_: unknown, args: Record<string, any>, context: WVServiceContext, _info: GraphQLResolveInfo, ...rest: unknown[]) => Promise<any>;
