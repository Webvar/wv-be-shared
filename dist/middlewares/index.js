import { companyMiddleware } from './company.middleware.js';
export { companyMiddleware } from './company.middleware.js';
import { meMiddleware } from './me.middleware.js';
export { meMiddleware } from './me.middleware.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extendAuth = (nextFunction) => meMiddleware(companyMiddleware(nextFunction));
