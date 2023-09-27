import { z } from 'zod';

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

const schema = [scopes, tokens].join('\n\n');
export default schema;
