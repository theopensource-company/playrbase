import { z } from 'zod';
import { fullname, record } from '../../lib/zod.ts';

const admin = /* surrealql */ `
    DEFINE TABLE admin SCHEMAFULL
        PERMISSIONS
            FOR select, update, delete, create WHERE $scope = 'admin';

    DEFINE FIELD name               ON TABLE admin TYPE string    ASSERT array::len(string::words($value)) > 1;
    DEFINE FIELD email              ON TABLE admin TYPE string    ASSERT string::is::email($value);
    DEFINE FIELD type               ON admin VALUE meta::tb(id) DEFAULT meta::tb(id);

    DEFINE FIELD profile_picture    ON admin TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';

    DEFINE FIELD created            ON TABLE admin TYPE datetime  VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated            ON TABLE admin TYPE datetime  VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX email ON TABLE admin COLUMNS email UNIQUE;
`;

export const Admin = z.object({
    id: record('admin'),
    name: fullname(),
    email: z.string().email(),
    profile_picture: z.string().optional(),
    type: z.literal('admin'),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Admin = z.infer<typeof Admin>;

/* Events */

const log = /* surrealql */ `
    DEFINE EVENT log ON admin THEN {
        LET $fields = ["name", "email"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

export default [admin, log].join('\n\n');
