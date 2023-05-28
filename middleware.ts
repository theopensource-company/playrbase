import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/cdn/')) {
        return NextResponse.rewrite(
            new URL(`/api${request.nextUrl.pathname}`, request.url)
        );
    }
}

export const config = {
    matcher: '/cdn/:path*',
};
