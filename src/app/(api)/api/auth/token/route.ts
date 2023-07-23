import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
    const res = extractUserTokenFromRequest(req);
    if (!res.success)
        return NextResponse.json(res, {
            headers: {
                'Set-Cookie': 'playrbase-token=; MaxAge=0;',
            },
        });

    return NextResponse.json(res);
}

export function DELETE() {
    return NextResponse.json(
        {
            success: true,
        },
        {
            headers: {
                'Set-Cookie': 'playrbase-token=; MaxAge=0;',
            },
        }
    );
}
