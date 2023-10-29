import {
    extractUserTokenFromRequest,
    generateCookieHeader,
} from '@/app/(api)/lib/token';
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
    const res = extractUserTokenFromRequest(req);
    if (!res.success) return NextResponse.json(res);

    return NextResponse.json(res);
}

export function DELETE(req: NextRequest) {
    return NextResponse.json(
        {
            success: true,
        },
        {
            headers: {
                'Set-Cookie': generateCookieHeader({
                    secure: req.nextUrl.protocol !== 'http:',
                }),
            },
        }
    );
}
