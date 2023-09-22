// middleware/jwt.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import loggerFactory from '../helpers/logger.js';
// TODO: jest test can't recognize import.meta.url
// const logger = loggerFactory(import.meta.url);
const logger = loggerFactory('file:///middlewares/jwtMiddleware.ts');
// Initialize the jwksClient with the jwksUri
const jwksClientInstance = jwksClient({
    jwksUri: process.env.JWKS_URI || '',
});
// Define a callback function for getting the signing key
function getKey(header, callback) {
    jwksClientInstance.getSigningKey(header.kid, (err, key) => {
        if (err) {
            console.error('Error getting signing key:', err);
            return callback(err);
        }
        const signingKey = (key === null || key === void 0 ? void 0 : key.getPublicKey()) || '';
        callback(null, signingKey);
    });
}
export function jwtVerifyCallback(err, decoded, req) {
    if (!err && decoded && typeof decoded === 'object') {
        const hasuraClaims = decoded['https://hasura.io/jwt/claims'];
        if (hasuraClaims) {
            req.me = {
                id: hasuraClaims['x-hasura-user-id'],
                auth0Id: decoded.sub,
                email: decoded.email,
                roles: hasuraClaims['x-hasura-allowed-roles'] || [],
            };
        }
    }
    else {
        const lg = logger.child({ function: 'jwtMiddleware' });
        lg.error({ status: 'error decoding token', err });
    }
}
export default function jwtMiddleware(req, _res, next) {
    var _a;
    const lg = logger.child({ function: 'jwtMiddleware' });
    lg.debug({ hasToken: !!req.headers.authorization });
    const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || '';
    if (token) {
        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (decoded !== undefined) {
                jwtVerifyCallback(err, decoded, req);
            }
            next();
        });
    }
    else {
        next();
    }
}
