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

const user_create = /* surrealql */ `
    DEFINE EVENT user_create ON user WHEN $event == "CREATE" THEN {
        CREATE log CONTENT {
            record: $after.id,
            event: $event
        };
    };
`;

const user_delete = /* surrealql */ `
    DEFINE EVENT user_delete ON user WHEN $event == "DELETE" THEN {
        CREATE log CONTENT {
            record: $before.id,
            event: $event
        };
    };
`;

const user_update = /* surrealql */ `
    DEFINE EVENT user_update ON user WHEN $event == "UPDATE" THEN {
        LET $fields = ["name", "email", "profile_picture"];
        fn::log::generate::update::batch($before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON user WHEN $event = "DELETE" THEN {
        DELETE $before->plays_in, $before->attends, $before->manages;
    };
`;

export default [
    user,
    user_create,
    user_delete,
    user_update,
    removal_cleanup,
].join('\n\n');
