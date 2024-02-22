import { z } from 'zod';
import { record } from '../../lib/zod.ts';
import { Event } from '../resources/event.ts';
import { Team } from '../resources/team.ts';
import { User } from '../resources/user.ts';

const attends = /* surrealql */ `
    DEFINE TABLE attends SCHEMAFULL
        PERMISSIONS
            // One can manage other managers if:
            // - They are an owner at any level
            // - They are an administrator, except for top-level.
            FOR create, update, delete
                WHERE   $auth.id IN fn::team::compute_players(in)
            FOR select
                WHERE   $auth.id IN fn::team::compute_players(in)
                OR      $auth.id IN out.organiser.managers.*.user;

    DEFINE FIELD in         ON attends TYPE record<user | team>;
    DEFINE FIELD out        ON attends TYPE record<event>;

    DEFINE FIELD confirmed  ON attends TYPE bool
        DEFAULT !out.options.manual_approval
        PERMISSIONS
            FOR update WHERE $auth.id IN out.organiser.managers.*.user;

    DEFINE FIELD players    ON attends TYPE array<record<user>>
        DEFAULT fn::team::compute_players(in)
        ASSERT array::len($value) > 0
        VALUE {
            LET $players = fn::team::compute_players(in);
            RETURN <set> $value[?id IN $players]
        };
    DEFINE FIELD players.*  ON attends TYPE record<user>;

    DEFINE FIELD created    ON attends TYPE datetime    VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated    ON attends TYPE datetime    VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX unique_relation ON attends COLUMNS in, out UNIQUE;
    DEFINE INDEX player_unique_to_event ON attends COLUMNS out, players.* UNIQUE;
`;

const log = /* surrealql */ `
    DEFINE EVENT log ON attends THEN {
        LET $fields = ["confirmed", "players"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const players_validation = /* surrealql */ `
    DEFINE EVENT players_validation ON attends WHEN $event IN ['CREATE', 'UPDATE'] THEN {
        LET $min_pool_size = $value.out.options.min_pool_size;
        LET $max_pool_size = $value.out.options.max_pool_size;
        LET $min_age = $value.out.options.min_age;
        LET $max_age = $value.out.options.max_age;

        IF $min_pool_size && array::len($value.players) < $min_pool_size {
            THROW "Too few players for registration " + <string> $value.id;
        };

        IF $max_pool_size && array::len($value.players) > $max_pool_size {
            THROW "Too many players for registration " + <string> $value.id;
        };

        IF $min_age && array::len($value.players[?age && age < $min_age]) > 0 {
            THROW "Some players are too young in registration " + <string> $value.id;
        };

        IF $max_age && array::len($value.players[?age && age > $max_age]) > 0 {
            THROW "Some players are too old in registration " + <string> $value.id;
        };
    };
`;

export default [attends, log, players_validation].join('\n\n');

export const Attends = z.object({
    id: record('attends'),
    in: z.union([record('user'), record('team')]),
    out: record('event'),
    confirmed: z.boolean(),
    players: z.array(record('user')),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Attends = z.infer<typeof Attends>;

export const RichAttends = Attends.extend({
    in: z.union([User, Team]),
    out: Event,
    players: z.array(User),
});

export type RichAttends = z.infer<typeof RichAttends>;
