import { sendEmail } from '@/app/(api)/lib/email';
import {
    extractUserTokenFromRequest,
    generateUserToken,
} from '@/app/(api)/lib/token';
import AuthChangeEmailEmail from '@/emails/auth-change-email';
import AuthRevertChangeEmailEmail from '@/emails/auth-revert-change-email';
import { Admin } from '@/schema/resources/admin';
import { token_secret } from '@/schema/resources/auth';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import { render } from '@react-email/components';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (!token)
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );

    const new_email = z
        .string()
        .email()
        .parse((await req.json()).email);

    const [res] = await surreal.query<[(User | Admin)[]]>(
        /* surrealql */ `
            SELECT * FROM type::table($scope_name) WHERE id = $subject
        `,
        { subject: token.ID, scope_name: token.SC, new_email }
    );

    const record = res.result?.[0];
    if (!record)
        return NextResponse.json(
            { success: false, error: 'unknown_user' },
            { status: 400 }
        );

    const token_verify = jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 60 * 30,
            iss: 'playrbase.app',
            aud: 'playrbase.app:change-email',
            sub: token.ID,
            SC: token.SC,
            email: new_email,
        },
        token_secret,
        {
            algorithm: 'HS512',
        }
    );

    const token_reset = jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 48,
            iss: 'playrbase.app',
            aud: 'playrbase.app:change-email',
            sub: token.ID,
            SC: token.SC,
            email: record.email,
        },
        token_secret,
        {
            algorithm: 'HS512',
        }
    );

    await Promise.all([
        sendEmail({
            from: 'noreply@playrbase.app',
            to: new_email,
            subject: 'PlayrBase change email',
            text: render(AuthChangeEmailEmail({ token: token_verify }), {
                plainText: true,
            }),
            html: render(AuthChangeEmailEmail({ token: token_verify })),
        }),
        sendEmail({
            from: 'noreply@playrbase.app',
            to: record.email,
            subject: 'PlayrBase change email',
            text: render(
                AuthRevertChangeEmailEmail({ token: token_reset, new_email }),
                {
                    plainText: true,
                }
            ),
            html: render(
                AuthRevertChangeEmailEmail({ token: token_reset, new_email })
            ),
        }),
    ]);

    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
    const token = z.string().parse(new URL(req.url).searchParams.get('token'));
    const decoded = await verifyChangeEmailToken(token);

    if (!decoded)
        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );

    const [res] = await surreal.query<[(User | Admin)[]]>(
        /* surrealql */ `
            BEGIN;
            LET $record = (SELECT * FROM type::table($scope_name) WHERE id = $subject)[0];
            RETURN IF ($record.id) THEN {
                RETURN UPDATE type::thing($record.id) SET email = $new_email;
            } ELSE RETURN [] END;
            COMMIT;
        `,
        {
            subject: decoded.subject,
            scope_name: decoded.scope,
            new_email: decoded.new_email,
        }
    );

    const user = res?.result?.[0];
    if (!user)
        return NextResponse.json(
            { success: false, error: 'unknown_user' },
            { status: 400 }
        );

    const { header } = generateUserToken({
        SC: decoded.scope,
        ID: user.id,
        secure: req.nextUrl.protocol !== 'http:',
    });

    return new NextResponse('Success! Redirecting to /account', {
        status: 302,
        headers: {
            Location: '/account',
            'Set-Cookie': header,
        },
    });
}

async function verifyChangeEmailToken(token: string) {
    return await new Promise<
        | {
              subject: string;
              scope: string;
              new_email: string;
          }
        | false
    >((resolve) => {
        jwt.verify(
            token,
            token_secret,
            {
                issuer: 'playrbase.app',
                audience: 'playrbase.app:change-email',
                algorithms: ['HS512'],
            },
            (error, decoded) => {
                if (error) return resolve(false);
                if (typeof decoded == 'object')
                    return resolve({
                        subject: decoded.sub as string,
                        scope: decoded.SC as string,
                        new_email: decoded.email as string,
                    });

                resolve(false);
            }
        );
    });
}
