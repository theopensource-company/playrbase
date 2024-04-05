import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import { BirthdatePermit } from '@/schema/resources/birthdate_permit';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmailVerificationToken } from '../../../auth/magic-link/route';

async function getSubject(req: NextRequest, body: Record<string, unknown>) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (token) {
        const [user] = await surreal.query<[User]>(
            /* surrealql */ `
                SELECT * FROM ONLY type::thing('user', $subject)
            `,
            { subject: token.ID }
        );

        if (!user)
            return NextResponse.json(
                { success: false, error: 'unknown_user' },
                { status: 400 }
            );

        return user.id;
    } else {
        const token = z.string().safeParse(body.token);
        if (!token.success)
            return NextResponse.json(
                { success: false, error: 'missing_preaccount_token' },
                { status: 400 }
            );

        const decoded = await verifyEmailVerificationToken(token.data);
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

        return decoded.subject;
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const subject = await getSubject(req, body);
    if (subject instanceof NextResponse) return subject;

    const parsed = z
        .object({
            birthdate: z.coerce.date(),
            birthdate_permit: z.string().length(6).optional(),
        })
        .safeParse(body);

    if (!parsed.success)
        return NextResponse.json(
            { success: false, error: 'invalid_body' },
            { status: 400 }
        );

    const { birthdate, birthdate_permit } = parsed.data;

    if (dayjs().diff(birthdate, 'years') <= 16) {
        if (!birthdate_permit)
            return NextResponse.json(
                { success: false, error: 'birthdate_permit_required' },
                { status: 400 }
            );

        const [permit] = await surreal.query<[BirthdatePermit | null]>(
            /* surql */ `SELECT * FROM birthdate_permit WHERE subject = $subject AND birthdate = $birthdate AND challenge = $birthdate_permit`,
            { subject, birthdate_permit, birthdate }
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
    }

    return NextResponse.json({ success: true });
}
