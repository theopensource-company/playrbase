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
                    OR (SELECT VALUE id FROM team WHERE [$parent.id, $auth.id] ALLINSIDE players.*)[0];

    DEFINE FIELD type               ON user VALUE meta::tb(id) DEFAULT meta::tb(id);
    DEFINE FIELD api_access         ON user DEFAULT false
        PERMISSIONS
            FOR update NONE
            FOR select WHERE
                $scope = 'admin' 
                OR id = $auth;

    DEFINE FIELD profile_picture    ON user TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';
            
    DEFINE FIELD created            ON user TYPE datetime VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated            ON user TYPE datetime VALUE time::now()             DEFAULT time::now()
        PERMISSIONS
            FOR select WHERE
                $scope = 'admin' 
                OR id = $auth.id;

    DEFINE INDEX email              ON user COLUMNS email UNIQUE;
`;

export const User = z.object({
    id: record('user'),
    name: fullname(),
    email: z.string().email(),
    type: z.literal('user'),
    api_access: z.boolean().default(false),
    profile_picture: z.string().optional(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
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
    };
`;

export default [user, log, removal_cleanup].join('\n\n');
