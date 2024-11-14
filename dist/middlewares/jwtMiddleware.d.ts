import jwt from 'jsonwebtoken';
import { Request, Response, RequestHandler } from 'express';
import { BaseContext } from '@apollo/server';
import { Me } from '../types/common.js';
declare module 'express' {
    interface Request {
        me?: Me;
        isAdmin?: boolean;
    }
}
export interface WVServiceContext extends BaseContext {
    req: Request;
    res: Response;
}
export declare function jwtVerifyCallback(err: Error | null, decoded: string | jwt.JwtPayload | null, req: Request): void;
declare const jwtMiddleware: RequestHandler;
export default jwtMiddleware;
