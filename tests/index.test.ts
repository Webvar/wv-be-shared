// index.test.ts

import * as index from '../src/index';

describe('Index exports', () => {
  it('should export loggerFactory as a function', () => {
    expect(typeof index.loggerFactory).toBe('function');
  });

  it('should export CustomError as a function', () => {
    expect(typeof index.CustomError).toBe('function');
  });

  it('should export jwtMiddleware as a function', () => {
    expect(typeof index.jwtMiddleware).toBe('function');
  });
});
