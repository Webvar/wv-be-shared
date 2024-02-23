import { GRPC } from '@cerbos/grpc';
export const isAllowed = async (principal, resource, action) => {
    try {
        let generatedPrincipal = {
            id: '',
            roles: [],
            attr: {},
        };
        if ('policyVersion' in principal) {
            generatedPrincipal = principal;
        }
        else {
            let attr = {};
            if ('attr' in principal) {
                attr = principal.attr;
            }
            generatedPrincipal = {
                id: principal.id,
                roles: principal.roles,
                attr: attr,
            };
        }
        let generatedResource = {
            id: '',
            kind: '',
        };
        if (typeof resource === 'object') {
            generatedResource = resource;
        }
        else {
            generatedResource = {
                id: resource,
                kind: resource,
            };
        }
        const request = {
            principal: generatedPrincipal,
            resource: generatedResource,
            action: action ? action : '',
        };
        const client = new GRPC(process.env.CERBOS_URL, { tls: false });
        const isAllowedResponse = await client.isAllowed(request);
        client.close();
        return isAllowedResponse;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};
