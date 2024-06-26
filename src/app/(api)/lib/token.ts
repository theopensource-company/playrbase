import { token_secret } from '@/schema/resources/auth';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { sessionLength } from '../config/auth';
import { issuer } from '../config/env';

export function generateUserToken({
    SC,
    SC: TK,
    ID,
    secure = true,
}: {
    SC: string;
    ID: string;
    secure?: boolean;
}) {
    const maxAge =
        SC in sessionLength
            ? sessionLength[SC as keyof typeof sessionLength]
            : 60 * 60;
    const token = jwt.sign(
        {
            NS: process.env.NEXT_PUBLIC_SURREAL_NAMESPACE,
            DB: process.env.NEXT_PUBLIC_SURREAL_DATABASE,
            SC,
            TK,
            ID,
            iss: issuer,
            exp: Math.floor(Date.now() / 1000) + maxAge,
            aud: `${issuer}:user-token`,
        },
        token_secret,
        {
            algorithm: 'HS512',
        }
    );

    const header = generateCookieHeader({ token, maxAge, secure });

    return { token, header, maxAge };
}

export function generateCookieHeader({
    token = '',
    maxAge = 0,
    secure = true,
}: {
    token?: string;
    maxAge?: number;
    secure?: boolean;
}) {
    const header = [
        `playrbase-token=${token};`,
        `HttpOnly;`,
        `Max-Age=${maxAge};`,
        `Path=/api;`,
        `SameSite=Strict;`,
        secure !== false && `Secure;`,
    ]
        .filter((a) => a)
        .join(' ');

    return header;
}

export function validateUserToken(token: string) {
    try {
        const decoded = jwt.verify(token, token_secret, {
            issuer,
            algorithms: ['HS512'],
            audience: `${issuer}:user-token`,
        });

        return decoded;
    } catch (_e) {
        return false;
    }
}

export function extractUserTokenFromRequest(req: NextRequest) {
    const token = req.cookies.get('playrbase-token')?.value;
    if (!token) {
        return {
            success: false,
            error: 'missing_token',
        };
    }

    const decoded = validateUserToken(token);
    if (!decoded || typeof decoded === 'string') {
        return {
            success: false,
            error: 'invalid_token',
        };
    }

    return { success: true, token, decoded };
}
