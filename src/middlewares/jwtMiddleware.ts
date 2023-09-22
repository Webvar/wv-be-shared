// middleware/jwt.ts

import jwt, { SigningKeyCallback } from 'jsonwebtoken';
import jwksClient, { CertSigningKey, RsaSigningKey } from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { BaseContext } from '@apollo/server';
import loggerFactory from '../helpers/logger.js';

// TODO: jest test can't recognize import.meta.url
// const logger = loggerFactory(import.meta.url);
const logger = loggerFactory('file:///middlewares/jwtMiddleware.ts');

// Initialize the jwksClient with the jwksUri
const jwksClientInstance = jwksClient({
  jwksUri: process.env.JWKS_URI || '',
});

declare module 'express' {
  export interface Request {
    me?: unknown;
  }
}

export interface WVServiceContext extends BaseContext {
  req: Request
  res: Response
}

// Define a callback function for getting the signing key
function getKey(header: jwt.JwtHeader, callback: SigningKeyCallback) {
  jwksClientInstance.getSigningKey(header.kid!, (err, key) => {
    if (err) {
      console.error('Error getting signing key:', err);
      return callback(err);
    }

    const signingKey = (key as CertSigningKey | RsaSigningKey)?.getPublicKey() || '';
    callback(null, signingKey);
  });
}

export function jwtVerifyCallback(err: Error | null, decoded: string | jwt.JwtPayload | null, req: Request) {
  if (!err && decoded && typeof decoded === 'object') {
    const hasuraClaims = (decoded as jwt.JwtPayload)['https://hasura.io/jwt/claims'];

    if (hasuraClaims) {
      req.me = {
        id: hasuraClaims['x-hasura-user-id'] as string,
        auth0Id: decoded.sub as string,
        email: decoded.email as string,
        roles: hasuraClaims['x-hasura-allowed-roles'] as string[] || [],
      };
    }
  } else {
    const lg = logger.child({ function: 'jwtMiddleware' });
    lg.error({ status: 'error decoding token', err });
  }
}

export default function jwtMiddleware(req: Request, _res: Response, next: NextFunction) {
  const lg = logger.child({ function: 'jwtMiddleware' });
  lg.debug({ hasToken: !!req.headers.authorization });

  const token = req.headers.authorization?.split(' ')[1] || '';

  if (token) {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (decoded !== undefined) {
        jwtVerifyCallback(err, decoded, req);
      }
      next();
    });
  } else {
    next();
  }
}
