import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const credential = /* surrealql */ `
    DEFINE TABLE credential SCHEMAFULL
        PERMISSIONS
            FOR select, update, delete WHERE $scope = 'user' AND user = $auth;

    DEFINE FIELD user ON credential TYPE record<user> VALUE $before OR $value;
    DEFINE FIELD name ON credential TYPE string ASSERT string::len($value) >= 1 && string::len($value) <= 64;
    DEFINE FIELD public_key ON credential TYPE string VALUE $before OR $value;
    DEFINE FIELD algorithm ON credential TYPE string VALUE $before OR $value ASSERT $value IN ['RS256', 'ES256'];
    DEFINE FIELD created ON credential TYPE datetime VALUE $before OR time::now() DEFAULT time::now();
    DEFINE FIELD updated ON credential TYPE datetime VALUE time::now() DEFAULT time::now();
`;

export const Credential = z.object({
    id: record('credential'),
    user: record('user'),
    name: z.string().min(1).max(64),
    public_key: z.string(),
    algorithm: z.union([z.literal('RS256'), z.literal('ES256')]),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Credential = z.infer<typeof Credential>;

export default credential;
