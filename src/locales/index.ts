import deepmerge from 'deepmerge';
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
    const fallback = await import(`./en/index`);
    const messages = deepmerge(fallback, l);

    return {
        messages,
        timeZone: 'Europe/Amsterdam',
        defaultTranslationValues,
    } satisfies RequestConfig;
}

export default getRequestConfig(importLocale);
