import { z } from 'zod';
import { point, record } from '../../lib/zod.ts';

const event = /* surrealql */ `
    DEFINE TABLE event SCHEMAFULL
        PERMISSIONS
            FOR select WHERE
                (discoverable = true && published = true)
                OR (published = true && id = $event_id)
                OR organiser.managers.*.user CONTAINS $auth
            FOR create, update, delete WHERE 
                (SELECT VALUE id FROM organisation WHERE $parent.organiser = id AND managers[WHERE role IN ['owner', 'administrator', 'event_manager']].user CONTAINS $auth.id)[0];

    DEFINE FIELD name                       ON event TYPE string ASSERT string::len($value) > 0;
    DEFINE FIELD description                ON event TYPE string;
    DEFINE FIELD logo                       ON event TYPE option<string> PERMISSIONS FOR update NONE;
    DEFINE FIELD banner                     ON event TYPE option<string> PERMISSIONS FOR update NONE;
    DEFINE FIELD outcome                    ON event TYPE option<string>;
    DEFINE FIELD location                   ON event TYPE option<geometry<point>>;

    DEFINE FIELD start                      ON event TYPE option<datetime>;
    DEFINE FIELD end                        ON event TYPE option<datetime>;
    DEFINE FIELD organiser                  ON event TYPE record<organisation>
        VALUE $before OR $value OR (SELECT VALUE organiser FROM ONLY $parent.tournament);

    DEFINE FIELD discoverable               ON event TYPE bool DEFAULT true;
    DEFINE FIELD published                  ON event TYPE bool DEFAULT false;
    DEFINE FIELD tournament                 ON event TYPE option<record<event>>;
    DEFINE FIELD tournament_path            ON event TYPE array<record<event>> DEFAULT [] PERMISSIONS FOR update NONE;
    DEFINE FIELD is_tournament              ON event VALUE {
        RETURN IF id {
            LET $id = meta::id(id);
            RETURN !!(SELECT VALUE id FROM event WHERE tournament AND meta::id(tournament) = $id)[0];
        } else {
            RETURN false;
        }
    };

    DEFINE FIELD root_for_org               ON event 
        VALUE !tournament OR (SELECT VALUE organiser FROM ONLY $parent.tournament) != organiser;

    DEFINE FIELD computed                   ON event 
        FLEXIBLE TYPE object
        DEFAULT {
            description: "",
            logo: "",
            banner: "",
            tournament: none,
            outcome: none,
            location: none,
        } 
        PERMISSIONS FOR update NONE;

    DEFINE FIELD options                    ON event TYPE object DEFAULT {};
    DEFINE FIELD options.min_pool_size      ON event TYPE option<number>;
    DEFINE FIELD options.max_pool_size      ON event TYPE option<number>;
    DEFINE FIELD options.min_team_size      ON event TYPE option<number>;
    DEFINE FIELD options.max_team_size      ON event TYPE option<number>;
    DEFINE FIELD options.min_age            ON event TYPE option<number>;
    DEFINE FIELD options.max_age            ON event TYPE option<number>;
    DEFINE FIELD options.manual_approval    ON event TYPE option<bool>;

    DEFINE FIELD type                       ON event VALUE meta::tb(id) DEFAULT meta::tb(id);

    DEFINE FIELD created                    ON event TYPE datetime VALUE $before OR time::now() DEFAULT time::now();
    DEFINE FIELD updated                    ON event TYPE datetime VALUE time::now()            DEFAULT time::now();

    DEFINE INDEX compound_organizer ON event FIELDS organiser;
    DEFINE INDEX compound_tournament ON event FIELDS tournament;
`;

export const Event = z.object({
    id: record('event'),
    name: z.string(),
    description: z.string(),
    logo: z.string().optional(),
    banner: z.string().optional(),
    outcome: z.string().optional(),
    location: point.optional(),

    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    organiser: record('organisation'),

    discoverable: z.boolean(),
    published: z.boolean(),
    tournament: record('event').optional(),
    tournament_path: z.array(record('event')),
    root_for_org: z.boolean(),
    is_tournament: z.boolean(),

    computed: z.object({
        description: z.string(),
        logo: z.string().nullable(),
        banner: z.string().nullable(),
        tournament: record('event').nullable(),
        outcome: z.string().nullable().optional(),
        location: point.nullable().optional(),
    }),

    options: z.object({
        min_pool_size: z.number().optional(),
        max_pool_size: z.number().optional(),
        min_team_size: z.number().optional(),
        max_team_size: z.number().optional(),
        min_age: z.number().optional(),
        max_age: z.number().optional(),
        manual_approval: z.boolean().optional(),
    }),

    type: z.literal('event').default('event'),

    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Event = z.infer<typeof Event>;

/* Events */

const log = /* surrealql */ `
    DEFINE EVENT log ON event THEN {
        LET $fields = ["name", "description", "published", "discoverable", "start", "end", "options"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON event WHEN $event = "DELETE" THEN {
        DELETE $before<-attends;
    };
`;

const update_tournament_status = /* surrealql */ `
    DEFINE EVENT update_tournament_status ON event WHEN $event IN ["CREATE", "DELETE"] AND $value.tournament THEN {
        UPDATE ($after ?? $before).tournament;
    };
`;

const update_computed_self = /* surrealql */ `
    DEFINE EVENT update_computed_self ON event WHEN $event = "UPDATE" AND (
        $before.description != $after.description ||
        $before.outcome != $after.outcome ||
        $before.location != $after.location ||
        $before.banner != $after.banner ||
        $before.logo != $after.logo
    ) THEN {
        UPDATE $value.id SET computed = fn::recursion::event::computed($this.*);
    };
`;

const update_computed_nested = /* surrealql */ `
    DEFINE EVENT update_computed_nested ON event WHEN $event = "UPDATE" AND $before.computed != $after.computed THEN {
        UPDATE event SET computed = fn::recursion::event::computed($this.*) WHERE tournament = $value.id;
    };
`;

const populate_initial_computed = /* surrealql */ `
    DEFINE EVENT populate_initial_computed ON event WHEN $event = "CREATE" THEN {
        UPDATE $value.id SET computed = fn::recursion::event::computed($value.*);
    };
`;

const populate_tournament_path = /* surrealql */ `
    DEFINE EVENT populate_tournament_path ON event WHEN $event = "CREATE" THEN {
        UPDATE $value.id SET tournament_path = array::append(($value.tournament.tournament_path ?? []), $value.id);
    };
`;

export default [
    event,
    log,
    removal_cleanup,
    update_tournament_status,
    update_computed_self,
    update_computed_nested,
    populate_initial_computed,
    populate_tournament_path,
].join('\n\n');
