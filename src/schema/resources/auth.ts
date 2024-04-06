import { z } from 'zod';

const scopes = /* surrealql */ `
    DEFINE SCOPE user;
    DEFINE SCOPE apikey;
`;

export const token_secret = z
    .string({
        invalid_type_error: 'The `SURREAL_TOKEN_SECRET` envvar is missing',
    })
    .parse(process.env.SURREAL_TOKEN_SECRET);

export const escaped_token_secret = JSON.stringify(token_secret);

const tokens = /* surrealql */ `
    DEFINE TOKEN user   ON SCOPE user   TYPE HS512 VALUE ${escaped_token_secret};
    DEFINE TOKEN apikey ON SCOPE apikey TYPE HS512 VALUE ${escaped_token_secret};
`;

const schema = [scopes, tokens].join('\n\n');
export default schema;
