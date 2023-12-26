import { z } from 'zod';
import { Organisation, OrganisationSafeParse } from './organisation';
import { Team } from './team';
import { User } from './user';

export const Actor = z.union([User, Organisation, OrganisationSafeParse, Team]);

export type Actor = z.infer<typeof Actor>;
