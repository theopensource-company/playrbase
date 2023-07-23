import { z } from 'zod';
import { fullname, record } from '../lib/zod.ts';

const admin = /* surrealql */ `
    DEFINE TABLE admin SCHEMAFULL
        PERMISSIONS
            FOR select, update, delete, create WHERE $scope = 'admin';

    DEFINE FIELD name     ON TABLE admin TYPE string    ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email    ON TABLE admin TYPE string    ASSERT is::email($value);
    DEFINE FIELD type     ON TABLE admin VALUE meta::tb(id);

    DEFINE FIELD created  ON TABLE admin TYPE datetime  VALUE $before OR time::now();
    DEFINE FIELD updated  ON TABLE admin TYPE datetime  VALUE time::now();

    DEFINE INDEX email ON TABLE admin COLUMNS email UNIQUE;
`;

export const Admin = z.object({
    id: record('admin'),
    name: fullname(),
    email: z.string().email(),
    type: z.literal('admin'),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Admin = z.infer<typeof Admin>;

/* Events */

const admin_create = /* surrealql */ `
    DEFINE EVENT admin_create ON admin WHEN $event == "CREATE" THEN {
        CREATE log CONTENT {
            record: $after.id,
            event: $event
        };
    };
`;

const admin_delete = /* surrealql */ `
    DEFINE EVENT admin_delete ON admin WHEN $event == "DELETE" THEN {
        CREATE log CONTENT {
            record: $before.id,
            event: $event
        };
    };
`;

const admin_update = /* surrealql */ `
    DEFINE EVENT admin_update ON admin WHEN $event == "UPDATE" THEN {
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

export default [admin, admin_create, admin_delete, admin_update].join('\n\n');
