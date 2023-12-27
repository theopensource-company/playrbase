import { surreal } from '@/app/(api)/lib/surreal';
import {
    extractUserTokenFromRequest,
    generateUserToken,
} from '@/app/(api)/lib/token';
import { User } from '@/schema/resources/user';
import { NextRequest, NextResponse } from 'next/server';

async function hasApiKeyAccess(user: string) {
    if (!user.startsWith('user:')) return false;
    const [res] = await surreal.select<User>(user);
    return !!res?.api_access;
}

export function GET(req: NextRequest) {
    const res = extractUserTokenFromRequest(req);
    if (!res.success) return NextResponse.json(res);

    if (!res.decoded?.ID)
        return NextResponse.json({
            success: false,
            error: 'id_lookup_failed',
        });

    if (!hasApiKeyAccess(res.decoded.ID))
        return NextResponse.json({
            success: false,
            error: 'no_api_access',
        });

    const { token } = generateUserToken({
        SC: 'apikey',
        ID: res.decoded.ID,
        secure: req.nextUrl.protocol !== 'http:',
    });

    return NextResponse.json({
        success: true,
        apikey: token,
        warning:
            "API Keys give access to administrate organisations and events according to the permissions of the user who generated it. They expire 30 days after generation. \n\n It is currently *NOT POSSIBLE* to rotate a key after it is generate, as it is stateless. To prevent unwanted usage after potential theft, the owner's account currently needs to be removed",
    });
}
