import { z } from 'zod';
import { Admin } from './admin';
import { Organisation, OrganisationSafeParse } from './organisation';
import { Team } from './team';
import { User } from './user';

export const Actor = z.union([
    Admin,
    User,
    Organisation,
    OrganisationSafeParse,
    Team,
]);

export type Actor = z.infer<typeof Actor>;

export function linkToActorOverview(actor: Actor) {
    switch (actor.type) {
        case 'user':
            return `/account`;
        case 'organisation':
            return `/organisation/${actor.slug}/overview`;
        default:
            return '/';
    }
}
