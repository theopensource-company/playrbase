export const Color = {
    Light: '#F8F2F4',
    Dark: '#222222',
    Darker: '#111111',
    Tint: '#3A81E4',
} as const;

export type Color = keyof typeof Color;
