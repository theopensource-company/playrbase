import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const event = /* surrealql */ `
    DEFINE TABLE event SCHEMAFULL
        PERMISSIONS
            FOR select WHERE $scope = 'admin' 
                OR (discoverable = true && published = true)
                OR (published = true && id = $event_id)
                OR (SELECT VALUE id FROM organisation WHERE $parent.organiser = id AND managers.*.user CONTAINS $auth.id)[0]
            FOR create, update, delete WHERE 
                $scope = 'admin'
                OR (SELECT VALUE id FROM organisation WHERE $parent.organiser = id AND managers[WHERE role IN ['owner', 'administrator', 'event_manager']].user CONTAINS $auth.id)[0];

    DEFINE FIELD name                       ON event TYPE string;
    DEFINE FIELD description                ON event TYPE string;
    DEFINE FIELD banner                     ON event TYPE option<string>;

    DEFINE FIELD start                      ON event TYPE option<datetime>;
    DEFINE FIELD end                        ON event TYPE option<datetime>;
    DEFINE FIELD organiser                  ON event TYPE record<organisation>
        VALUE $before OR $value OR (SELECT VALUE organiser FROM ONLY $parent.tournament);

    DEFINE FIELD discoverable               ON event TYPE bool DEFAULT true;
    DEFINE FIELD published                  ON event TYPE bool DEFAULT false;
    DEFINE FIELD tournament                 ON event TYPE option<record<event>>;
    DEFINE FIELD is_tournament              ON event VALUE <future> {
        LET $id = meta::id(id);
        RETURN !!(SELECT VALUE id FROM event WHERE tournament AND meta::id(tournament) = $id)[0];
    };

    DEFINE FIELD root_for_org               ON event 
        VALUE !tournament OR (SELECT VALUE organiser FROM ONLY $parent.tournament) != organiser;

    DEFINE FIELD options                    ON event TYPE object DEFAULT {};
    DEFINE FIELD options.min_pool_size      ON event TYPE option<number>;
    DEFINE FIELD options.max_pool_size      ON event TYPE option<number>;
    DEFINE FIELD options.min_age            ON event TYPE option<number>;
    DEFINE FIELD options.max_age            ON event TYPE option<number>;
    DEFINE FIELD options.manual_approval    ON event TYPE option<bool>;

    DEFINE FIELD created                    ON event TYPE datetime VALUE $before OR time::now() DEFAULT time::now();
    DEFINE FIELD updated                    ON event TYPE datetime VALUE time::now()            DEFAULT time::now();
`;

export const Event = z.object({
    id: record('event'),
    name: z.string(),
    description: z.string(),
    banner: z.string().optional(),

    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    organiser: record('organisation'),

    discoverable: z.boolean(),
    published: z.boolean(),
    tournament: record('event').optional(),
    root_for_org: z.boolean(),

    options: z.object({
        min_pool_size: z.number().optional(),
        max_pool_size: z.number().optional(),
        min_age: z.number().optional(),
        max_age: z.number().optional(),
        manual_approval: z.boolean().optional(),
    }),

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

export default [event, log, removal_cleanup].join('\n\n');
