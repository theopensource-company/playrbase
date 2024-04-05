import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import { BirthdatePermit } from '@/schema/resources/birthdate_permit';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { decoded: token } = extractUserTokenFromRequest(req);

    if (!token)
        return NextResponse.json(
            { success: false, error: 'invalid_token' },
            { status: 400 }
        );

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
    const extra = { ...user.extra };

    if (dayjs().diff(birthdate, 'years') <= 16) {
        if (!birthdate_permit)
            return NextResponse.json(
                { success: false, error: 'birthdate_permit_required' },
                { status: 400 }
            );

        const [permit] = await surreal.query<[BirthdatePermit | null]>(
            /* surql */ `SELECT * FROM birthdate_permit WHERE subject = type::thing('user', $user) AND birthdate = $birthdate AND challenge = $birthdate_permit`,
            { user: user.id, birthdate_permit, birthdate }
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

    await surreal.merge(user.id, {
        birthdate,
        extra,
    });

    return NextResponse.json({ success: true });
}
