import { TOrganisationRecord } from './Organisation.types';

export type TPublicOrganisationID = `puborg:${string}`;
export type TPublicOrganisationRecord = Pick<
    TOrganisationRecord,
    'name' | 'description' | 'website' | 'email' | 'created' | 'slug'
> & {
    id: TPublicOrganisationID;
};
