import { TOrganisationRecord, TOrganisationID } from './Organisation.types';

export type TEventID = `event:${string}`;
export type TEventRecord = {
    id: TEventID;
    name: string;
    description: string;
    banner?: string;
    category: TEventCategories;
    start?: Date;
    end?: Date;
    organiser: TOrganisationID;
    organiser_details: Pick<
        TOrganisationRecord,
        'name' | 'description' | 'email' | 'website'
    > | null;
    discoverable: boolean;
    published: boolean;
    tournament?: TEventID;
    tournament_details: Pick<TEventRecord, 'name' | 'description'> | null;
    created: Date;
    updated: Date;
};

export const EventCategories = {
    baseball: 'Baseball',
    bla: 'Bla',
};

export type TEventCategories = keyof typeof EventCategories;
