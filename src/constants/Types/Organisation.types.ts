import { TEmail, TWebsite } from './Common.types';
import { TManagerID } from './Manager.types';

export type TOrganisationID = `organisation:${string}`;
export type TOrganisationRecord = {
    id: TOrganisationID;
    name: string;
    description: string;
    website: TWebsite;
    email: TEmail;
    slug: string;
    tier: TOrganisationTier;
    part_of: TOrganisationID;
    manager_roles: {
        id: TManagerID;
        role: TOrganisationManagerRoles;
    }[];
    managers: {
        id: TManagerID;
        role: TOrganisationManagerRoles;
        org?: TOrganisationID;
    }[];
    created: Date;
    updated: Date;
};

export const OrganisationManagerRoles = {
    owner: 'Owner',
    administrator: 'Administrator',
    event_manager: 'Event manager',
    event_viewer: 'Event viewer',
};

export type TOrganisationManagerRoles = keyof typeof OrganisationManagerRoles;
export type TOrganisationManagerRolesHierarchy = {
    [key in TOrganisationManagerRoles]: number;
};

export const OrganisationManagerRolesHierarchy = Object.keys(
    OrganisationManagerRoles
).reduce<TOrganisationManagerRolesHierarchy>(
    (prev, curr, i) => ({
        ...prev,
        [curr]: i,
    }),
    {} as TOrganisationManagerRolesHierarchy
);

export const OrganisationTiers = {
    free: 'Free',
    basic: 'Basic',
    business: 'Business',
    enterprise: 'Enterprise',
};

export type TOrganisationTier = keyof typeof OrganisationTiers;
