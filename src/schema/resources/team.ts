const team = /* surrealql */ `
    DEFINE TABLE team SCHEMAFULL
        PERMISSIONS
            FOR create WHERE $scope = 'user'
            FOR select, update, delete 
                WHERE $auth.id IN players.*;

    DEFINE FIELD name           ON team TYPE string ASSERT string::len($value) > 0;
    DEFINE FIELD description    ON team TYPE option<string>;
    DEFINE FIELD players        ON team
        VALUE <future> {
            -- Find all confirmed players of this team
            LET $players = SELECT <-plays_in[?confirmed] AS players FROM ONLY $parent.id;
            RETURN SELECT VALUE players.*.in FROM ONLY $players;
        };

    DEFINE FIELD created_by     ON team TYPE record<user>
        DEFAULT $auth.id
        VALUE $before OR $auth.id
        PERMISSIONS FOR select NONE;

    DEFINE FIELD created        ON team TYPE datetime VALUE $before OR time::now()    DEFAULT time::now();
    DEFINE FIELD updated        ON team TYPE datetime VALUE time::now()               DEFAULT time::now();
`;

const relate_creator = /* surrealql */ `
    DEFINE EVENT relate_creator ON team WHEN $event = "CREATE" THEN {
        RELATE ($value.created_by)->plays_in->($value.id) SET confirmed = true;
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON team WHEN $event = "DELETE" THEN {
        DELETE $before<-plays_in, $before->attends;
    };
`;

export default [team, relate_creator, removal_cleanup].join('\n\n');
