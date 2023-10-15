import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const challenge = /* surrealql */ `
    DEFINE TABLE challenge SCHEMAFULL;

    DEFINE FIELD challenge ON challenge TYPE string VALUE $before OR rand::uuid() DEFAULT rand::uuid();
    DEFINE FIELD user ON challenge TYPE option<record<user>> VALUE $before OR $value;
    DEFINE FIELD created ON challenge TYPE datetime VALUE $before OR time::now() DEFAULT time::now();
`;

export const Challenge = z.object({
    id: record('challenge'),
    challenge: z.string(),
    user: record('user').optional(),
    created: z.coerce.date(),
});

export type Challenge = z.infer<typeof Challenge>;

export default challenge;
