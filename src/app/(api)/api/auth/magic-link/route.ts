import { sendEmail } from '@/app/(api)/lib/email';
import { generateUserToken } from '@/app/(api)/lib/token';
import AuthMagicLinkEmail from '@/emails/auth-magic-link';
import { fullname } from '@/lib/zod';
import { token_secret } from '@/schema/resources/auth';
import { BirthdatePermit } from '@/schema/resources/birthdate_permit';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import { render } from '@react-email/components';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const { identifier, followup } = z
        .object({
            identifier: z.string().email(),
            followup: z.string().optional(),
        })
        .parse(await req.json());

    const [res] = await surreal.query<[User[]]>(
        /* surrealql */ `
            SELECT * FROM user WHERE email = $identifier
        `,
        { identifier }
    );

    const record = res[0];
    const email = record?.email || identifier;
    const sub = record ? record.id : identifier;

    if (sub) {
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 30,
                iss: 'playrbase.app',
                aud: 'playrbase.app:verify-email',
                sub,
                SC: 'user',
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
            text: render(AuthMagicLinkEmail({ token, followup }), {
                plainText: true,
            }),
            html: render(AuthMagicLinkEmail({ token, followup })),
        });
    }

    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const token = z.string().default('').parse(searchParams.get('token'));
    const followup = z.string().nullable().parse(searchParams.get('followup'));
    const decoded = await verifyEmailVerificationToken(token);

    if (!decoded) {
        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );
    }

    const isEmail = z.string().email().safeParse(decoded.subject).success;
    if (isEmail) {
        const params = new URLSearchParams({ token });
        if (followup) params.set('followup', followup);
        const url = `/account/create-profile?${params}`;

        return new NextResponse(`Success! Redirecting to ${url}`, {
            status: 302,
            headers: {
                Location: url,
            },
        });
    }

    const [res] = await surreal.query<[User[]]>(
        /* surrealql */ `
            SELECT * FROM type::thing('user', $subject);
        `,
        { subject: decoded.subject }
    );

    const user = res?.[0];
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'unknown_user' },
            { status: 400 }
        );
    }

    const { header } = generateUserToken({
        SC: decoded.scope,
        ID: user.id,
        secure: req.nextUrl.protocol !== 'http:',
    });

    return new NextResponse(
        `Success! Redirecting to ${followup || '/account'}`,
        {
            status: 302,
            headers: {
                Location: followup || '/account',
                'Set-Cookie': header,
            },
        }
    );
}

export async function PUT(req: NextRequest) {
    const { name, birthdate, birthdate_permit, token } = z
        .object({
            name: fullname(),
            birthdate: z.coerce.date(),
            birthdate_permit: z.string().length(6).optional(),
            token: z.string(),
        })
        .parse(await req.json());

    const decoded = await verifyEmailVerificationToken(token);

    if (!decoded) {
        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );
    }

    const isEmail = z.string().email().safeParse(decoded.subject).success;
    if (!isEmail) {
        return NextResponse.json(
            { success: false, error: 'invalid_token_subject' },
            { status: 400 }
        );
    }

    if (decoded.scope !== 'user') {
        return NextResponse.json(
            { success: false, error: 'invalid_token_scope' },
            { status: 400 }
        );
    }

    const email = decoded.subject;
    const extra: Record<string, unknown> = {};

    if (dayjs().diff(birthdate, 'years') <= 16) {
        if (!birthdate_permit)
            return NextResponse.json(
                { success: false, error: 'birthdate_permit_required' },
                { status: 400 }
            );

        const [permit] = await surreal.query<[BirthdatePermit | null]>(
            /* surql */ `SELECT * FROM birthdate_permit WHERE subject = $email AND birthdate = $birthdate AND challenge = $birthdate_permit`,
            { email, birthdate_permit, birthdate }
        );

        if (!permit)
            return NextResponse.json(
                { success: false, error: 'birthdate_permit_invalid' },
                { status: 400 }
            );

        if (dayjs().diff(permit.created, 'minutes') > 30)
            return NextResponse.json(
                { success: false, error: 'birthdate_permit_expired' },
                { status: 400 }
            );

        extra.parent_email = permit.parent_email;
    }

    const [user] = await surreal.create<
        User,
        Pick<User, 'email' | 'name' | 'birthdate' | 'extra'>
    >('user', {
        email,
        name,
        birthdate,
        extra,
    });

    if (!user) {
        return NextResponse.json(
            { success: false, error: 'user_creation_failed' },
            { status: 400 }
        );
    }

    const userToken = generateUserToken({
        SC: decoded.scope,
        ID: user.id,
        secure: req.nextUrl.protocol !== 'http:',
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

export async function verifyEmailVerificationToken(token: string) {
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
                if (typeof decoded == 'object') {
                    return resolve({
                        subject: decoded.sub as string,
                        scope: decoded.SC as string,
                    });
                }

                resolve(false);
            }
        );
    });
}
