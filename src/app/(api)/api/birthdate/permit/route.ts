import { sendEmail } from '@/app/(api)/lib/email';
import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import BirthdatePermitEmail from '@/emails/birthdate-permit-email';
import { BirthdatePermit } from '@/schema/resources/birthdate_permit';
import { User } from '@/schema/resources/user';
import { surreal } from '@api/lib/surreal';
import { render } from '@react-email/components';
import dayjs from 'dayjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmailVerificationToken } from '../../auth/magic-link/route';

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

    console.log(subject);

    const parsed = z
        .object({
            birthdate: z.coerce.date(),
            parent_email: z.string().email(),
        })
        .safeParse(body);

    if (!parsed.success)
        return NextResponse.json(
            { success: false, error: 'invalid_body' },
            { status: 400 }
        );

    const { birthdate, parent_email } = parsed.data;
    if (dayjs().diff(birthdate, 'years') > 16)
        return NextResponse.json(
            { success: false, error: 'no_permit_required' },
            { status: 400 }
        );

    const [permit] = await surreal.create<
        BirthdatePermit,
        Pick<BirthdatePermit, 'subject' | 'birthdate' | 'parent_email'>
    >('birthdate_permit', {
        subject,
        birthdate,
        parent_email,
    });

    if (!permit)
        return NextResponse.json(
            { success: false, error: 'permit_creation_failure' },
            { status: 400 }
        );

    await sendEmail({
        from: 'noreply@playrbase.app',
        to: parent_email,
        subject: 'Child account on Playrbase',
        text: render(BirthdatePermitEmail({ challenge: permit.challenge }), {
            plainText: true,
        }),
        html: render(BirthdatePermitEmail({ challenge: permit.challenge })),
    });

    return NextResponse.json({ success: true });
}
