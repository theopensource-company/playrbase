import { z } from 'zod';
import { fullname, record } from '../../lib/zod.ts';

const user = /* surrealql */ `
    DEFINE TABLE user SCHEMAFULL 
        PERMISSIONS 
            FOR select FULL
            FOR update, delete WHERE $scope = 'user' AND id = $auth.id;

    DEFINE FIELD name               ON user TYPE string ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email              ON user TYPE string ASSERT string::is::email($value)
        PERMISSIONS
            FOR update NONE
            FOR select 
                WHERE
                    id = $auth.id
                    OR email = $email
                    OR (SELECT VALUE id FROM organisation WHERE [$parent.id, $auth.id] ALLINSIDE managers.*.user)[0]
                    OR (SELECT VALUE id FROM team WHERE [$parent.id, $auth.id] ALLINSIDE players.*)[0]
                    OR ((id)->attends->event[?organiser.managers.user CONTAINS $auth.id])[0]
                    OR ((id)->plays_in->team->attends->event[?organiser.managers.user CONTAINS $auth.id])[0];

    DEFINE FIELD birthdate          ON user TYPE datetime 
        ASSERT $value < time::now()
        PERMISSIONS FOR update NONE;

    DEFINE FIELD type               ON user VALUE meta::tb(id) DEFAULT meta::tb(id);
    DEFINE FIELD api_access         ON user DEFAULT false
        PERMISSIONS
            FOR update NONE
            FOR select WHERE id = $auth;

    DEFINE FIELD profile_picture    ON user TYPE option<string>
        PERMISSIONS FOR update NONE;
            
    DEFINE FIELD created            ON user TYPE datetime VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated            ON user TYPE datetime VALUE time::now()             DEFAULT time::now()
        PERMISSIONS FOR select WHERE id = $auth.id;

    DEFINE FIELD extra              ON user FLEXIBLE TYPE object PERMISSIONS NONE;

    DEFINE INDEX email              ON user COLUMNS email UNIQUE;
`;

export const User = z.object({
    id: record('user'),
    name: fullname(),
    email: z.string().email(),
    birthdate: z.coerce.date(),
    type: z.literal('user'),
    api_access: z.boolean().default(false),
    profile_picture: z.string().optional(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
    extra: z.record(z.unknown()).optional().nullable(),
});

export type User = z.infer<typeof User>;

export const UserAnonymous = User.omit({
    email: true,
    api_access: true,
    updated: true,
});

export type UserAnonymous = z.infer<typeof UserAnonymous>;

// - Team co-members
// - Managers in organisations from which the user is participating in one of their events
export const UserAsRelatedUser = User.omit({
    api_access: true,
    updated: true,
});

export type UserAsRelatedUser = z.infer<typeof UserAsRelatedUser>;

/* Events */

const log = /* surrealql */ `
    DEFINE EVENT log ON user THEN {
        LET $fields = ["name", "email", "profile_picture"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON user WHEN $event = "DELETE" THEN {
        DELETE $before->plays_in, $before->attends, $before->manages;
        DELETE invite WHERE origin = $before.id;
    };
`;

const convert_invites = /* surrealql */ `
    DEFINE EVENT convert_invites ON user WHEN $event = "CREATE" THEN {
        UPDATE invite WHERE origin = $after.email;
    }; 
`;

export default [user, log, removal_cleanup, convert_invites].join('\n\n');
