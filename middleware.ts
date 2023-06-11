import { languages } from '@/locales/languages';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const handleI18nRouting = createIntlMiddleware({
    locales: Object.keys(languages),
    defaultLocale: 'en',
    localePrefix: 'always',
});

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/cdn/'))
        return NextResponse.rewrite(
            new URL(`/api${request.nextUrl.pathname}`, request.url)
        );

    const response = handleI18nRouting(request);
    return response;
}

export const config = {
    matcher: ['/cdn/:path*', '/((?!api|_next|.*\\..*).*)'],
};
