import { IsAllowedRequest, Resource, Principal, Value } from '@cerbos/core';
import { GRPC } from '@cerbos/grpc';

import { PrincipalMe, Me } from '../../types/common';

export const isAllowed = async (
  principal: Principal | Me | PrincipalMe,
  resource: Resource | string,
  action: string
) => {
  try {
    let generatedPrincipal: Principal = {
      id: '',
      roles: [],
      attr: {},
    };

    if ('policyVersion' in principal) {
      generatedPrincipal = principal;
    } else {
      let attr: Record<string, Value> = {};
      if ('attr' in principal) {
        attr = principal.attr as Record<string, Value>;
      }
      generatedPrincipal = {
        id: principal.id as string,
        roles: principal.roles as string[],
        attr: attr,
      };
    }

    let generatedResource: Resource = {
      id: '',
      kind: '',
    };

    if (typeof resource === 'object') {
      generatedResource = resource;
    } else {
      generatedResource = {
        id: resource as string,
        kind: resource as string,
      };
    }

    const request: IsAllowedRequest = {
      principal: generatedPrincipal,
      resource: generatedResource,
      action: action ? action : '',
    };

    const client = new GRPC(process.env.CERBOS_URL as string, { tls: false });
    const isAllowedResponse = await client.isAllowed(request);

    client.close();
    return isAllowedResponse;
  } catch (error) {
    console.error(error);
    return false;
  }
};
