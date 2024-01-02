import { z } from 'zod';
import { record, role } from '../../lib/zod.ts';

const user = /* surrealql */ `
    DEFINE TABLE invite SCHEMAFULL 
        PERMISSIONS 
            FOR create NONE
            FOR update WHERE $scope = 'user' AND $auth IN target.managers[?role = "owner" OR (role = "administrator" AND org != NONE)].*.user
            FOR select, delete
                WHERE $scope = 'user' AND (
                    origin IN [$auth, $auth.email]
                    OR $auth IN target.players
                    OR $auth IN target.managers[?role = "owner" OR (role = "administrator" AND org != NONE)].*.user
                );

    DEFINE FIELD origin         ON invite TYPE string | record<user> 
        VALUE (SELECT VALUE id FROM ONLY user WHERE email = $value LIMIT 1) OR $before OR $value
        ASSERT type::is::record($value) OR string::is::email($value);
    DEFINE FIELD target         ON invite TYPE record<organisation> | record<team>
        VALUE $before OR $value; 

    DEFINE FIELD role           ON invite TYPE option<string> 
        ASSERT IF $value != NONE THEN $value IN ['owner', 'administrator', 'event_manager', 'event_viewer'] ELSE true END;
            
    DEFINE FIELD invited_by     ON invite TYPE record<user>
        VALUE $before OR $value;

    DEFINE FIELD created        ON invite TYPE datetime VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated        ON invite TYPE datetime VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX unique_invite  ON invite COLUMNS origin, target UNIQUE;
`;

export const Invite = z.object({
    id: record('invite'),
    origin: z.union([z.string().email(), record('user')]),
    target: z.union([record('team'), record('organisation')]),
    role: role.optional(),
    invited_by: record('user'),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Invite = z.infer<typeof Invite>;

/* Events */

const enfore_unique_index = /* surrealql */ `
    DEFINE EVENT enfore_unique_index ON invite THEN {
        IF type::is::record(origin) {
            UPDATE invite WHERE origin = $value.origin.email AND target = $value.target;
        };
    };
`;

const prevent_duplicate_relation = /* surrealql */ `
    DEFINE EVENT prevent_duplicate_relation ON invite THEN {
        LET $edge = SELECT VALUE id FROM ONLY $value.origin->manages, $value.origin->plays_in WHERE out = $value.target LIMIT 1;
        IF $edge {
            THROW "Relation which this invite represents already exists.";
        };
    };
`;

export default [user, enfore_unique_index, prevent_duplicate_relation].join(
    '\n\n'
);
