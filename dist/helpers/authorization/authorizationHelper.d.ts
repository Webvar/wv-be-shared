import { Resource, Principal } from '@cerbos/core';
import { PrincipalMe, Me } from '../../types/common';
export declare const isAllowed: (principal: Principal | Me | PrincipalMe, resource: Resource | string, action: string) => Promise<boolean>;
