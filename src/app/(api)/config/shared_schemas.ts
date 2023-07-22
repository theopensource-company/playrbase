import { z } from 'zod';

export const MagicLinkVerification = z.object({
    identifier: z.string(),
    challenge: z.string(),
});
