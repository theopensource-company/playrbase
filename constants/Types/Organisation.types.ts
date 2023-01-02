import { TEmail, TWebsite } from './Common.types';
import { TManagerID, TManagerRecord } from './Manager.types';

export type TOrganisationID = `organisation:${string}`;
export type TOrganisationRecord = {
    id: TOrganisationID;
    name: string;
    description: string;
    website: TWebsite;
    email: TEmail;
    master_organisation: TOrganisationID;
    manager_roles: {
        id: TManagerID;
        role: TOrganisationManagerRoles;
    }[];
    managers: (Pick<TManagerRecord, 'id' | 'name' | 'email'> & {
        org?: Pick<TOrganisationRecord, 'id' | 'name'>;
        role: TOrganisationManagerRoles;
    })[];
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
