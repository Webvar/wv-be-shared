export interface Me {
    id: string;
    auth0Id?: string;
    email?: string;
    roles: string[];
    companyId?: string;
}
export interface PrincipalMe extends Me {
    attr: Record<string, unknown>;
}
