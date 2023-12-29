import { z } from 'zod';
import { Admin } from './admin';
import { Event } from './event';
import { Organisation, OrganisationSafeParse } from './organisation';
import { Team, TeamAnonymous } from './team';
import { User, UserAnonymous, UserAsRelatedUser } from './user';

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
    UserAnonymous,
    UserAsRelatedUser,
    Admin,
    Organisation,
    OrganisationSafeParse,
    Team,
    TeamAnonymous,
    Event,
    FakeProfile,
]);
export type Profile = z.infer<typeof Profile>;

export const unknownProfile = {
    name: 'Unknown Profile',
    type: 'unknown',
} satisfies FakeProfile;
