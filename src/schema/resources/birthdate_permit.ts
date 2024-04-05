import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const birthdate_permit = /* surrealql */ `
    DEFINE TABLE birthdate_permit SCHEMAFULL;

    DEFINE FIELD challenge      ON birthdate_permit TYPE string READONLY 
        VALUE (
            <string> rand::int(0, 9) +
            <string> rand::int(0, 9) +
            <string> rand::int(0, 9) +
            <string> rand::int(0, 9) +
            <string> rand::int(0, 9) +
            <string> rand::int(0, 9)
        )
        DEFAULT '';

    DEFINE FIELD subject        ON birthdate_permit TYPE string | record<user> READONLY
        ASSERT IF type::is::string($value) THEN string::is::email($value) ELSE true END;

    DEFINE FIELD birthdate      ON birthdate_permit TYPE datetime READONLY;
    DEFINE FIELD parent_email   ON birthdate_permit TYPE string READONLY ASSERT string::is::email($value);
    DEFINE FIELD created        ON birthdate_permit TYPE datetime READONLY VALUE time::now();

    DEFINE INDEX compound_user ON birthdate_permit FIELDS user;
`;

export const BirthdatePermit = z.object({
    id: record('birthdate_permit'),
    challenge: z.string().length(6),
    subject: z.union([z.string().email(), record('user')]),
    birthdate: z.coerce.date(),
    parent_email: z.string().email(),
    created: z.coerce.date(),
});

export type BirthdatePermit = z.infer<typeof BirthdatePermit>;

export default birthdate_permit;
