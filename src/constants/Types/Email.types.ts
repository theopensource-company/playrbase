import { z } from 'zod';

export const Email = z.object({
    to: z.string(),
    from: z.string(),
    subject: z.string(),
    text: z.string(),
    html: z.string(),
});

export type Email = z.infer<typeof Email>;
