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

export const languageList = Object.keys(languages) as unknown as Array<
    keyof typeof languages
>;

type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];

export const languageEntries = Object.entries(languages) as Entries<
    typeof languages
>;
