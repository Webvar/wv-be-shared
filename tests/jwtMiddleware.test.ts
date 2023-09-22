import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { jwtMiddleware } from '../src';
import { jwtVerifyCallback } from '../src/middlewares/jwtMiddleware';

jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');

const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;
const mockJwksClientGetSigningKey = jest.fn();

const mockRequest: Request = {
  headers: {
    authorization: 'Bearer some_token',
  },
} as Request;

const mockResponse: Response = {} as Response;
const mockNext: NextFunction = jest.fn();

describe('jwtMiddleware', () => {
  it('should call jwt.verify if token exists', () => {
    jwtMiddleware(mockRequest, mockResponse, mockNext);
    expect(mockJwtVerify).toHaveBeenCalled();
  });

  it('should call next if no token exists', () => {
    mockRequest.headers.authorization = undefined;
    jwtMiddleware(mockRequest, mockResponse, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  describe('jwtVerifyCallback', () => {
    it('should set me property if JWT is decoded', () => {
      const decoded = {
        'https://hasura.io/jwt/claims': {
          'x-hasura-user-id': '123',
          'x-hasura-allowed-roles': ['user'],
        },
        sub: 'some-sub',
        email: 'test@example.com',
      };
      jwtVerifyCallback(null, decoded, mockRequest);
      expect(mockRequest.me).toEqual({
        id: '123',
        auth0Id: 'some-sub',
        email: 'test@example.com',
        roles: ['user'],
      });
    });

    it('should not set me property if JWT is not decoded', () => {
      mockRequest.me = {}; // Reset to empty object
      jwtVerifyCallback(new Error('Invalid token'), null, mockRequest);
      expect(mockRequest.me).toEqual({});
    });
  });
});
