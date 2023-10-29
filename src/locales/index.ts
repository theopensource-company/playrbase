import { getRequestConfig } from 'next-intl/server';

type GetRequestConfigParams = Parameters<
    Parameters<typeof getRequestConfig>[0]
>[0];

export async function importLocale({ locale }: GetRequestConfigParams) {
    const l = (await import(`./${locale}`)) ?? {};
    return {
        messages: { ...l },
    };
}

export default getRequestConfig(importLocale);
