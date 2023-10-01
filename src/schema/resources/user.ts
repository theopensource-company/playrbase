import { z } from 'zod';
import { fullname, record } from '../../lib/zod.ts';

const user = /* surrealql */ `
    DEFINE TABLE user SCHEMAFULL 
        PERMISSIONS 
            FOR select FULL
            FOR update, delete WHERE id = $auth.id;

    DEFINE FIELD name               ON user TYPE string ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email              ON user TYPE string ASSERT string::is::email($value)
        PERMISSIONS
            FOR select 
                WHERE $scope = 'user'
                AND (
                    id = $auth.id
                    OR email = $email
                    OR (SELECT VALUE id FROM organisation WHERE [$parent.id, $auth.id] ALLINSIDE managers.*.user)[0]
                    OR (SELECT VALUE id FROM team WHERE [$parent.id, $auth.id] ALLINSIDE players.*)[0]
                );

    DEFINE FIELD type               ON user VALUE meta::tb(id);

    DEFINE FIELD profile_picture    ON user TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';
            
    DEFINE FIELD created            ON user TYPE datetime VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated            ON user TYPE datetime VALUE time::now()             DEFAULT time::now()
        PERMISSIONS
            FOR select WHERE
                $scope = 'admin' OR
                (
                    $scope = 'user' && id = $auth.id
                );

    DEFINE INDEX email              ON user COLUMNS email UNIQUE;
`;

export const User = z.object({
    id: record('user'),
    name: fullname(),
    email: z.string().email(),
    type: z.literal('user'),
    profile_picture: z.string().optional(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type User = z.infer<typeof User>;

/* Events */

const log = /* surrealql */ `
    DEFINE EVENT log ON user THEN {
        LET $fields = ["name", "email", "profile_picture"];
        fn::log::generate::any::batch($before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON user WHEN $event = "DELETE" THEN {
        DELETE $before->plays_in, $before->attends, $before->manages;
    };
`;

export default [user, log, removal_cleanup].join('\n\n');
