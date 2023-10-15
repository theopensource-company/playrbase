import { surreal } from '@/app/(api)/lib/surreal';
import { generateUserToken } from '@/app/(api)/lib/token';
import { record } from '@/lib/zod';
import { Challenge } from '@/schema/resources/challenge';
import { Credential } from '@/schema/resources/credential';
import { User } from '@/schema/resources/user';
import { server } from '@passwordless-id/webauthn';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const Body = z.object({
        challengeId: record('challenge'),
        authentication: z.object({
            credentialId: z.string(),
            authenticatorData: z.string(),
            clientData: z.string(),
            signature: z.string(),
        }),
    });

    const body = Body.safeParse(await req.json());
    if (!body.success)
        return NextResponse.json(
            { success: false, error: 'invalid_body' },
            { status: 400 }
        );

    const { challengeId, authentication } = body.data;
    const challenge = await surreal
        .query<[Challenge]>(
            /* surrealql */ `
                SELECT * FROM ONLY type::thing('challenge', $challengeId) WHERE !user AND created > time::now() - 5m
            `,
            { challengeId }
        )
        .then(([res]) => res.result);

    if (!challenge)
        return NextResponse.json(
            { success: false, error: 'invalid_challenge' },
            { status: 400 }
        );

    const credential = await surreal
        .query<[Credential]>(
            /* surrealql */ `
            SELECT * FROM ONLY type::thing('credential', $credentialId);
        `,
            { credentialId: authentication.credentialId }
        )
        .then(([res]) => res.result);

    if (!credential)
        return NextResponse.json(
            { success: false, error: 'invalid_credential' },
            { status: 400 }
        );

    const expected = {
        challenge: challenge.challenge,
        origin: req.nextUrl.origin,
        userVerified: true,
        counter: -1,
    };

    const authenticationParsed = await server
        .verifyAuthentication(
            authentication,
            {
                id: authentication.credentialId,
                publicKey: credential.public_key,
                algorithm: credential.algorithm,
            },
            expected
        )
        .catch(() => false);

    if (!authenticationParsed)
        return NextResponse.json(
            { success: false, error: 'authentication_failed' },
            { status: 400 }
        );

    const user = await surreal
        .query<[User]>(
            /* surrealql */ `
                SELECT * FROM ONLY type::thing('user', $id);
            `,
            { id: credential.user }
        )
        .then(([res]) => res.result);

    if (!user)
        return NextResponse.json(
            { success: false, error: 'unknown_user' },
            { status: 400 }
        );

    const { header } = generateUserToken({
        SC: 'user',
        ID: user.id,
        secure: req.nextUrl.protocol !== 'http:',
    });

    return NextResponse.json(
        {
            success: true,
            name: credential.name,
        },
        {
            headers: {
                'Set-Cookie': header,
            },
        }
    );
}
