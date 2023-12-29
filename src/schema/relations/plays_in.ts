import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const plays_in = /* surrealql */ `
    DEFINE TABLE plays_in SCHEMAFULL
        PERMISSIONS
            // One can manage other managers if:
            // - They are an owner at any level
            // - They are an administrator, except for top-level.
            FOR create 
                WHERE   $auth.id IN out.players.*
            FOR update, delete
                WHERE   $auth.id = in.id
                OR      $auth.id IN out.players.*
            FOR select
                -- To add: organisational managers to which the team has registered
                WHERE   $auth.id = in.id
                OR      $auth.id IN out.players.*;

    DEFINE FIELD in         ON plays_in TYPE record<user>;
    DEFINE FIELD out        ON plays_in TYPE record<team>;

    DEFINE FIELD confirmed  ON plays_in TYPE bool        DEFAULT false VALUE $before || IF !$auth OR in.id == $auth.id { $value } ELSE { false }; 

    DEFINE FIELD created    ON plays_in TYPE datetime    VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated    ON plays_in TYPE datetime    VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX unique_relation ON plays_in COLUMNS in, out UNIQUE;
`;

export const PlaysIn = z.object({
    id: record('plays_in'),
    in: record('user'),
    out: record('team'),
    confirmed: z.boolean(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type PlaysIn = z.infer<typeof PlaysIn>;

const log = /* surrealql */ `
    DEFINE EVENT log ON plays_in THEN {
        LET $fields = ["confirmed"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const verify_registrations_after_deletion = /* surrealql */ `
    DEFINE EVENT verify_registrations_after_deletion ON plays_in WHEN $event = "DELETE" THEN {
        UPDATE ($before.out->attends || []);
    };
`;

const verify_nonempty_team_after_deletion = /* surrealql */ `
    DEFINE EVENT verify_nonempty_team_after_deletion ON plays_in WHEN $event = "DELETE" THEN {
        IF $before.out.id && array::len($before.out.players) == 0 {
            THROW "Team cannot be empty, remove it instead."
        };
    };
`;

export default [
    plays_in,
    log,
    verify_registrations_after_deletion,
    verify_nonempty_team_after_deletion,
].join('\n\n');
