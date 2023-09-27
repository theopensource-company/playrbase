import { z } from 'zod';
import { record } from '../../lib/zod.ts';
import { Organisation } from './organisation.ts';

const puborg = /* surrealql */ `
    DEFINE TABLE puborg AS SELECT name, description, website, email, created, slug FROM organisation;
`;

export const PublicOrganisation = Organisation.pick({
    name: true,
    description: true,
    website: true,
    email: true,
    created: true,
    slug: true,
}).merge(
    z.object({
        id: record('puborg'),
    })
);

export type PublicOrganisation = z.infer<typeof PublicOrganisation>;

export default puborg;
