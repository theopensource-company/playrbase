import { z } from 'zod';

export const Intent = z.union([
    z.literal('profile_picture'),
    z.literal('logo'),
    z.literal('banner'),
]);
export type Intent = z.infer<typeof Intent>;

export const intentProperties = {
    profile_picture: {
        width: 128,
        height: 128,
        round: true,
    },
    logo: {
        width: 512,
        height: 512,
        round: true,
    },
    banner: {
        width: 2048,
        height: 512,
        round: false,
    },
};
