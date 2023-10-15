import { sendEmail } from '@/app/(api)/lib/email';
import { generateUserToken } from '@/app/(api)/lib/token';
import AuthMagicLinkEmail from '@/emails/auth-magic-link';
import { fullname } from '@/lib/zod';
import { Admin } from '@/schema/resources/admin';
import { token_secret } from '@/schema/resources/auth';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import { render } from '@react-email/components';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const { identifier, scope } = z
        .object({
            identifier: z.string().email(),
            scope: z.union([z.literal('admin'), z.literal('user')]),
        })
        .parse(await req.json());

    const [res] = await surreal.query<[(User | Admin)[]]>(
        /* surrealql */ `
            SELECT * FROM type::table($scope_name) WHERE email = $identifier
        `,
        { identifier, scope_name: scope }
    );

    const record = res.result?.[0];
    const email = record?.email || identifier;
    const sub = record ? record.id : scope == 'user' ? identifier : undefined;

    if (sub) {
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 30,
                iss: 'playrbase.app',
                aud: 'playrbase.app:verify-email',
                sub,
                SC: scope,
            },
            token_secret,
            {
                algorithm: 'HS512',
            }
        );

        await sendEmail({
            from: 'noreply@playrbase.app',
            to: email,
            subject: 'PlayrBase signin link',
            text: render(AuthMagicLinkEmail({ token }), {
                plainText: true,
            }),
            html: render(AuthMagicLinkEmail({ token })),
        });
    }

    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
    const token = z.string().parse(new URL(req.url).searchParams.get('token'));
    const decoded = await verifyEmailVerificationToken(token);

    if (!decoded)
        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );

    const isEmail = z.string().email().safeParse(decoded.subject).success;
    if (isEmail) {
        const url = `/account/create-profile?${new URLSearchParams({
            token,
        })}`;

        return new NextResponse(`Success! Redirecting to ${url}`, {
            status: 302,
            headers: {
                Location: url,
            },
        });
    }

    const [res] = await surreal.query<[(User | Admin)[]]>(
        /* surrealql */ `
            SELECT * FROM type::table($scope_name) WHERE id = $subject;
        `,
        { subject: decoded.subject, scope_name: decoded.scope }
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
    });

    return new NextResponse('Success! Redirecting to /console', {
        status: 302,
        headers: {
            Location: '/console',
            'Set-Cookie': header,
        },
    });
}

export async function PUT(req: NextRequest) {
    const { name, token } = z
        .object({
            name: fullname(),
            token: z.string(),
        })
        .parse(await req.json());

    const decoded = await verifyEmailVerificationToken(token);

    if (!decoded)
        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );

    const isEmail = z.string().email().safeParse(decoded.subject).success;
    if (!isEmail)
        return NextResponse.json(
            { success: false, error: 'invalid_token_subject' },
            { status: 400 }
        );

    if (decoded.scope !== 'user')
        return NextResponse.json(
            { success: false, error: 'invalid_token_scope' },
            { status: 400 }
        );

    const [user] = await surreal.create<User, Pick<User, 'email' | 'name'>>(
        'user',
        {
            email: decoded.subject,
            name,
        }
    );

    if (!user)
        return NextResponse.json(
            { success: false, error: 'user_creation_failed' },
            { status: 400 }
        );

    const userToken = generateUserToken({
        SC: decoded.scope,
        ID: user.id,
    });

    return NextResponse.json(
        {
            success: true,
            token: userToken.token,
        },
        {
            status: 200,
            headers: {
                'Set-Cookie': userToken.header,
            },
        }
    );
}

async function verifyEmailVerificationToken(token: string) {
    return await new Promise<
        | {
              subject: string;
              scope: string;
          }
        | false
    >((resolve) => {
        jwt.verify(
            token,
            token_secret,
            {
                issuer: 'playrbase.app',
                audience: 'playrbase.app:verify-email',
                algorithms: ['HS512'],
            },
            (error, decoded) => {
                if (error) return resolve(false);
                if (typeof decoded == 'object')
                    return resolve({
                        subject: decoded.sub as string,
                        scope: decoded.SC as string,
                    });

                resolve(false);
            }
        );
    });
}
