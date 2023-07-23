import { z } from 'zod';
import { record } from '../lib/zod.ts';

const scopes = /* surrealql */ `
    DEFINE SCOPE admin;
    DEFINE SCOPE user;
`;

export const token_secret = z
    .string({
        invalid_type_error: 'The `SURREAL_TOKEN_SECRET` envvar is missing',
    })
    .parse(process.env.SURREAL_TOKEN_SECRET);
export const escaped_token_secret = JSON.stringify(token_secret);
const tokens = /* surrealql */ `
    DEFINE TOKEN admin  ON SCOPE admin  TYPE HS512 VALUE ${escaped_token_secret};
    DEFINE TOKEN user   ON SCOPE user   TYPE HS512 VALUE ${escaped_token_secret};
`;

const auth_challenge = /* surrealql */ `
    DEFINE TABLE auth_challenge SCHEMAFULL;
    DEFINE PARAM $auth_methods VALUE ['magic-link', 'change-email'];

    DEFINE FIELD subject    ON auth_challenge TYPE string | record<admin | user> 
        ASSERT
            is::email(<string> $value) 
            OR type::thing($value).id;
    DEFINE FIELD details    ON auth_challenge FLEXIBLE TYPE object;
    DEFINE FIELD method     ON auth_challenge TYPE string ASSERT $value IN $auth_methods; 
    DEFINE FIELD challenge  ON auth_challenge VALUE $before OR rand::string(40, 60);
    DEFINE FIELD created    ON auth_challenge VALUE $before OR time::now();
`;

export const AuthChallenge = z.object({
    id: record('auth_challenge'),
    subject: z.union([record('admin'), record('user')]),
    details: z.record(z.string(), z.unknown()),
    method: z.literal('magic-link'),
    challenge: z.coerce.string().min(40).max(60),
    created: z.coerce.date(),
});

export type AuthChallenge = z.infer<typeof AuthChallenge>;

const schema = [scopes, tokens, auth_challenge].join('\n\n');
export default schema;
