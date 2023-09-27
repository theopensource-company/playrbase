import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const log = /* surrealql */ `
    DEFINE TABLE log SCHEMALESS
        PERMISSIONS
            FOR select WHERE record = $auth.id OR $scope = 'admin'
            FOR update, delete, create NONE;

    DEFINE FIELD record                 ON log          TYPE option<record>;
    DEFINE FIELD event                  ON log          TYPE string
        ASSERT $value IN ['CREATE', 'UPDATE', 'DELETE'];

    DEFINE FIELD change                 ON log          TYPE option<object>;
    DEFINE FIELD change.field           ON log          TYPE option<string>;
    DEFINE FIELD change.value           ON log          TYPE option<object>;
    DEFINE FIELD change.value.before    ON log          TYPE any; 
    DEFINE FIELD change.value.after     ON log          TYPE any;

    DEFINE FIELD details                ON log FLEXIBLE TYPE option<object>;
    DEFINE FIELD created                ON log          TYPE datetime 
        VALUE $before OR time::now()
        DEFAULT time::now();
`;

export const Log = z.object({
    id: record('log'),
    record: record(),
    event: z.union([
        z.literal('CREATE'),
        z.literal('UPDATE'),
        z.literal('DELETE'),
    ]),

    change: z
        .object({
            field: z.string(),
            value: z
                .object({
                    before: z.any(),
                    after: z.any(),
                })
                .optional(),
        })
        .optional(),

    details: z.record(z.string(), z.any()).optional(),
    created: z.coerce.date(),
});

export type Log = z.infer<typeof Log>;

export default log;
