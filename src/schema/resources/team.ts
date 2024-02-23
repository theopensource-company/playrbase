import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const team = /* surrealql */ `
    DEFINE TABLE team SCHEMAFULL
        PERMISSIONS
            FOR select FULL
            FOR create WHERE $scope = 'user'
            FOR update, delete 
                WHERE $scope = 'user' AND $auth.id IN players.*;

    DEFINE FIELD name           ON team TYPE string ASSERT string::len($value) > 0;
    DEFINE FIELD description    ON team TYPE option<string>;
    DEFINE FIELD players        ON team
        VALUE <future> {
            -- Find all confirmed players of this team
            LET $players = SELECT <-plays_in AS players FROM ONLY $parent.id;
            RETURN SELECT VALUE players.*.in FROM ONLY $players;
        };

    DEFINE FIELD logo           ON team TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';
    DEFINE FIELD banner         ON team TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';

    DEFINE FIELD slug           ON team VALUE meta::id(id);
    DEFINE FIELD type           ON team VALUE meta::tb(id) DEFAULT meta::tb(id);
    DEFINE FIELD created_by     ON team TYPE record<user>
        DEFAULT $auth.id
        VALUE $before OR $auth.id
        PERMISSIONS FOR select NONE;

    DEFINE FIELD created        ON team TYPE datetime VALUE $before OR time::now()    DEFAULT time::now();
    DEFINE FIELD updated        ON team TYPE datetime VALUE time::now()               DEFAULT time::now()
        PERMISSIONS FOR select WHERE 
            $auth.id IN players.*
            OR ((id)->attends->event[?organiser.managers.user CONTAINS $auth.id])[0];
`;

export const Team = z.object({
    id: record('team'),
    name: z.string(),
    description: z.string().optional(),
    players: z.array(record('user')),
    logo: z.string().optional(),
    banner: z.string().optional(),
    slug: z.string(),
    type: z.literal('team'),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Team = z.infer<typeof Team>;

export const TeamAnonymous = Team.omit({
    updated: true,
});

export type TeamAnonymous = z.infer<typeof TeamAnonymous>;

const relate_creator = /* surrealql */ `
    DEFINE EVENT relate_creator ON team WHEN $event = "CREATE" THEN {
        RELATE ($value.created_by)->plays_in->($value.id) SET confirmed = true;
    };
`;

const log = /* surrealql */ `
    DEFINE EVENT log ON team THEN {
        LET $fields = ["name", "description", "players"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON team WHEN $event = "DELETE" THEN {
        DELETE $before<-plays_in, $before->attends;
    };
`;

export default [team, relate_creator, log, removal_cleanup].join('\n\n');
