import { GetRequestConfigParams } from 'next-intl/dist/src/server/getRequestConfig';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(importLocale);

export async function importLocale({ locale }: GetRequestConfigParams) {
    const l = (await import(`./${locale}`)) ?? {};
    return {
        messages: { ...l },
    };
}
