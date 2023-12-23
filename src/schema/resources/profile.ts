import { z } from 'zod';
import { Admin } from './admin';
import { Event } from './event';
import { Organisation, OrganisationSafeParse } from './organisation';
import { Team } from './team';
import { User } from './user';

export const FakeProfile = z.object({
    id: z.undefined(),
    name: z.literal('Unknown Profile'),
    email: z.undefined(),
    type: z.literal('unknown'),
    profile_picture: z.undefined(),
    created: z.undefined(),
    updated: z.undefined(),
});

export type FakeProfile = z.infer<typeof FakeProfile>;

export const Profile = z.union([
    User,
    Admin,
    Organisation,
    OrganisationSafeParse,
    Team,
    Event,
    FakeProfile,
]);
export type Profile = z.infer<typeof Profile>;

export const unknownProfile = {
    name: 'Unknown Profile',
    type: 'unknown',
} satisfies FakeProfile;
