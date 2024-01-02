import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const plays_in = /* surrealql */ `
    DEFINE TABLE plays_in SCHEMAFULL
        PERMISSIONS
            // One can manage other managers if:
            // - They are an owner at any level
            // - They are an administrator, except for top-level.
            FOR create 
                WHERE   (SELECT VALUE id FROM invite WHERE origin = $auth.id AND $parent.in = $auth.id AND $parent.out = target).id
            FOR update, delete
                WHERE   $auth.id = in.id
                OR      $auth.id IN out.players.*
            FOR select
                -- To add: organisational managers to which the team has registered
                WHERE   $auth.id = in.id
                OR      $auth.id IN out.players.*;

    DEFINE FIELD in         ON plays_in TYPE record<user>;
    DEFINE FIELD out        ON plays_in TYPE record<team>;

    DEFINE FIELD created    ON plays_in TYPE datetime    VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated    ON plays_in TYPE datetime    VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX unique_relation ON plays_in COLUMNS in, out UNIQUE;
`;

export const PlaysIn = z.object({
    id: record('plays_in'),
    in: record('user'),
    out: record('team'),
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

const cleanup_invite = /* surrealql */ `
    DEFINE EVENT cleanup_invite ON plays_in WHEN $event = "CREATE" THEN {
        DELETE invite WHERE origin = $value.in AND target = $value.out;
    }
`;

export default [
    plays_in,
    log,
    verify_registrations_after_deletion,
    verify_nonempty_team_after_deletion,
    cleanup_invite,
].join('\n\n');
