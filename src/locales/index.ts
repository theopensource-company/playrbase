import { getRequestConfig } from 'next-intl/server';
import { defaultTranslationValues } from './defaultTranslationValues';

type RequestConfig = Awaited<
    ReturnType<Parameters<typeof getRequestConfig>[0]>
>;

type GetRequestConfigParams = Parameters<
    Parameters<typeof getRequestConfig>[0]
>[0];

export async function importLocale({ locale }: GetRequestConfigParams) {
    const l = (await import(`./${locale}`)) ?? {};
    return {
        messages: { ...l },
        timeZone: 'Europe/Amsterdam',
        defaultTranslationValues,
    } satisfies RequestConfig;
}

export default getRequestConfig(importLocale);
