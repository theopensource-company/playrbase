export const languages = {
    en: {
        native: 'English',
        flag: 'gb',
    },
    nl: {
        native: 'Nederlands',
        flag: 'nl',
    },
} satisfies Record<
    string,
    {
        native: string;
        flag: string;
    }
>;

export type Language = keyof typeof languages;
