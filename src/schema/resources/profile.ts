import { z } from 'zod';
import { Admin } from './admin';
import { Event } from './event';
import { Organisation, OrganisationSafeParse } from './organisation';
import { Team, TeamAnonymous } from './team';
import { User, UserAnonymous, UserAsRelatedUser } from './user';

export const EmailProfile = z.object({
    email: z.string().email(),
    type: z.literal('email').default('email'),
});

export type EmailProfile = z.infer<typeof EmailProfile>;

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
    EmailProfile,
]);
export type Profile = z.infer<typeof Profile>;

export const unknownProfile = {
    name: 'Unknown Profile',
    type: 'unknown',
} satisfies FakeProfile;

export function linkToProfile(
    profile: Profile,
    target?: 'public' | 'manage' | 'registrations' | 'settings'
) {
    switch (target) {
        case 'public': {
            switch (profile.type) {
                case 'user':
                    return `/u/${profile.id.slice(5)}`;
                case 'organisation':
                    return `/o/${profile.slug}`;
                case 'team':
                    return `/t/${profile.id.slice(5)}`;
                case 'event':
                    return `/e/${profile.id.slice(6)}`;
            }

            break;
        }

        case 'manage': {
            switch (profile.type) {
                case 'organisation':
                    return `/organisation/${profile.slug}/overview`;
                case 'team':
                    return `/team/${profile.id.slice(5)}/overview`;
                case 'event':
                    return `/e/${profile.id.slice(6)}/manage/overview`;
            }

            break;
        }

        case 'registrations': {
            switch (profile.type) {
                case 'user':
                    return `/account/registrations`;
                case 'team':
                    return `/team/${profile.id.slice(5)}/registrations`;
                case 'event':
                    return `/e/${profile.id.slice(6)}/manage/attendees`;
            }

            break;
        }

        case 'settings': {
            switch (profile.type) {
                case 'organisation':
                    return `/organisation/${profile.slug}/settings`;
                case 'team':
                    return `/team/${profile.id.slice(5)}/settings`;
                case 'event':
                    return `/e/${profile.id.slice(6)}/manage/settings`;
            }

            break;
        }
    }
}
