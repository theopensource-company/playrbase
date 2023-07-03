import { z } from 'zod';
import { record } from '../lib/zod.ts';

const scopes = /* surrealql */ `
    DEFINE SCOPE admin;
    DEFINE SCOPE manager;
    DEFINE SCOPE player;
`;

export const token_secret = z
    .string({
        invalid_type_error: 'The `SURREAL_TOKEN_SECRET` envvar is missing',
    })
    .parse(process.env.SURREAL_TOKEN_SECRET);
export const escaped_token_secret = JSON.stringify(token_secret);
const tokens = /* surrealql */ `
    DEFINE TOKEN admin   ON SCOPE admin   TYPE HS512 VALUE ${escaped_token_secret};
    DEFINE TOKEN manager ON SCOPE manager TYPE HS512 VALUE ${escaped_token_secret};
    DEFINE TOKEN player  ON SCOPE player  TYPE HS512 VALUE ${escaped_token_secret};
`;

const auth_challenge = /* surrealql */ `
    DEFINE TABLE auth_challenge SCHEMAFULL;

    DEFINE FIELD subject    ON auth_challenge TYPE record<admin | manager | user>;
    DEFINE FIELD method     ON auth_challenge TYPE string ASSERT $value IN ['magic-link']; 
    DEFINE FIELD challenge  ON auth_challenge VALUE $before OR rand::string(40, 60);
    DEFINE FIELD created    ON auth_challenge VALUE $before OR time::now();
`;

export const AuthChallenge = z.object({
    id: record('auth_challenge'),
    subject: z.union([record('admin'), record('manager'), record('player')]),
    method: z.literal('magic-link'),
    challenge: z.coerce.string().min(40).max(60),
    created: z.coerce.date(),
});

export type AuthChallenge = z.infer<typeof AuthChallenge>;

const schema = [scopes, tokens, auth_challenge].join('\n\n');
export default schema;
