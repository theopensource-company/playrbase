import { fullname, record } from '@/lib/zod';
import { z } from 'zod';

const manager = /* surrealql */ `
    DEFINE TABLE manager SCHEMAFULL 
        PERMISSIONS 
            FOR select, update, delete WHERE 
                $scope = 'admin' OR
                ($scope = 'manager' && id = $auth.id) OR 
                (
                    $scope = 'manager' && 
                    id != $auth.id &&
                    (SELECT VALUE id FROM organisation WHERE [$parent.id, $auth.id] ALLINSIDE managers.*.id)[0]
                )
            FOR create WHERE $scope = 'admin'
    ;

    DEFINE FIELD name       ON TABLE manager TYPE string    ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email      ON TABLE manager TYPE string    ASSERT is::email($value);

    DEFINE FIELD created    ON TABLE manager TYPE datetime  VALUE $before OR time::now();
    DEFINE FIELD updated    ON TABLE manager TYPE datetime  VALUE time::now();

    DEFINE INDEX email      ON TABLE manager COLUMNS email UNIQUE;
`;

export const Manager = z.object({
    id: record('manager'),
    name: fullname(),
    email: z.string().email(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Manager = z.infer<typeof Manager>;

/* Events */

const manager_create = /* surrealql */ `
    DEFINE EVENT manager_create ON manager WHEN $event == "CREATE" THEN {
        CREATE log CONTENT {
            record: $after.id,
            event: $event
        };
    };
`;

const manager_delete = /* surrealql */ `
    DEFINE EVENT manager_delete ON manager WHEN $event == "DELETE" THEN {
        CREATE log CONTENT {
            record: $before.id,
            event: $event
        };
    };
`;

const manager_update = /* surrealql */ `
    DEFINE EVENT manager_update ON manager WHEN $event == "UPDATE" THEN {
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

export default [manager, manager_create, manager_delete, manager_update].join(
    '\n\n'
);
