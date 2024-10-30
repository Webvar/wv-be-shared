import { companyMiddleware } from './company.middleware';
export { companyMiddleware } from './company.middleware';

import { meMiddleware } from './me.middleware';
export { meMiddleware } from './me.middleware';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extendAuth = (nextFunction: any) =>
  meMiddleware(companyMiddleware(nextFunction));
