import { z } from 'zod';
import { fullname, record } from '../lib/zod.ts';

const player = /* surrealql */ `
    DEFINE TABLE player SCHEMAFULL 
        PERMISSIONS 
            FOR select, update, delete WHERE 
                ($scope = 'player' && id = $auth.id)
                OR $scope = 'admin'
            FOR create WHERE $scope = 'admin'
    ;

    DEFINE FIELD name               ON player TYPE string ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email              ON player TYPE string ASSERT is::email($value);

    DEFINE FIELD properties         ON player TYPE object VALUE $value OR $before OR {};
    DEFINE FIELD properties.height  ON player TYPE option<number>;
    DEFINE FIELD properties.gender  ON player TYPE option<string> 
        ASSERT $value IN ['male', 'female', 'other', NONE];

    DEFINE FIELD profile_picture    ON player TYPE option<string>
        VALUE 
            IF not($scope) OR $scope = 'admin' THEN
                RETURN $input;
            ELSE IF $input == 'remove' THEN
                RETURN NONE;
            ELSE
                RETURN $before OR NULL;
            END;
            
    DEFINE FIELD birthdate          ON player TYPE datetime;
    DEFINE FIELD created            ON player TYPE datetime VALUE $before OR time::now();
    DEFINE FIELD updated            ON player TYPE datetime VALUE time::now();

    DEFINE INDEX email              ON player COLUMNS email UNIQUE;
`;

export const Player = z.object({
    id: record('player'),
    name: fullname(),
    email: z.string().email(),
    properties: z.object({
        height: z.number().optional(),
        gender: z
            .union([z.literal('male'), z.literal('female'), z.literal('other')])
            .optional(),
    }),
    profile_picture: z.string().optional(),
    birthdate: z.coerce.date(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Player = z.infer<typeof Player>;

/* Events */

const player_create = /* surrealql */ `
    DEFINE EVENT player_create ON player WHEN $event == "CREATE" THEN {
        CREATE log CONTENT {
            record: $after.id,
            event: $event
        };
    };
`;

const player_delete = /* surrealql */ `
    DEFINE EVENT player_delete ON player WHEN $event == "DELETE" THEN {
        CREATE log CONTENT {
            record: $before.id,
            event: $event
        };
    };
`;

const player_update = /* surrealql */ `
    DEFINE EVENT player_update ON player WHEN $event == "UPDATE" THEN {
        IF $before.name != $after.name THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "name",
                    value: { before: $before.name, after: $after.name }
                }
            }
        END;

        IF $before.email != $after.email THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "email",
                    value: { before: $before.email, after: $after.email }
                }
            }
        END;
    };
`;

export default [player, player_create, player_delete, player_update].join(
    '\n\n'
);
