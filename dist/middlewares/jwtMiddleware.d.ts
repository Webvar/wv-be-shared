import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { BaseContext } from '@apollo/server';
declare module 'express' {
    interface Request {
        me?: unknown;
    }
}
export interface WVServiceContext extends BaseContext {
    req: Request;
    res: Response;
}
export declare function jwtVerifyCallback(err: Error | null, decoded: string | jwt.JwtPayload | null, req: Request): void;
export default function jwtMiddleware(req: Request, _res: Response, next: NextFunction): void;
