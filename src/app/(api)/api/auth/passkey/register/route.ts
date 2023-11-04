import { surreal } from '@/app/(api)/lib/surreal';
import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import { record } from '@/lib/zod';
import { Challenge } from '@/schema/resources/challenge';
import { Credential } from '@/schema/resources/credential';
import { User } from '@/schema/resources/user';
import { server } from '@passwordless-id/webauthn';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (!token) {
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );
    }

    const [user] = await surreal.select<User>(token.ID);
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'unknown_user' },
            { status: 403 }
        );
    }

    const Body = z.object({
        challengeId: record('challenge'),
        registration: z.object({
            username: z.literal(user.email),
            credential: z.object({
                id: z.string(),
                publicKey: z.string(),
                algorithm: z.union([z.literal('RS256'), z.literal('ES256')]),
            }),
            authenticatorData: z.string(),
            clientData: z.string(),
        }),
    });

    const body = Body.safeParse(await req.json());

    if (!body.success) {
        return NextResponse.json(
            { success: false, error: 'invalid_body' },
            { status: 400 }
        );
    }

    const { challengeId, registration } = body.data;
    const challenge = await surreal
        .query<[Challenge]>(
            /* surrealql */ `
                SELECT * FROM ONLY type::thing($challengeId) WHERE user = $user AND created > time::now() - 5m
            `,
            { challengeId, user: user.id }
        )
        .then(([res]) => res);

    if (!challenge) {
        return NextResponse.json(
            { success: false, error: 'invalid_challenge' },
            { status: 400 }
        );
    }

    const expected = {
        challenge: challenge.challenge,
        origin: process.env.PLAYRBASE_ENV_ORIGIN ?? req.nextUrl.origin,
    };

    const registrationParsed = await server
        .verifyRegistration(registration, expected)
        .catch(() => false);

    if (!registrationParsed) {
        return NextResponse.json(
            { success: false, error: 'invalid_credential' },
            { status: 400 }
        );
    }

    const credential = await surreal
        .query<[Credential]>(
            /* surrealql */ `
                CREATE ONLY type::thing('credential', $id) CONTENT {
                    user: $user,
                    name: $name,
                    public_key: $public_key,
                    algorithm: $algorithm,
                };
            `,
            {
                id: registration.credential.id,
                user: user.id,
                name: user.name.split(' ').at(0) + "'s Passkey",
                public_key: registration.credential.publicKey,
                algorithm: registration.credential.algorithm,
            }
        )
        .then(([res]) => res);

    if (!credential) {
        return NextResponse.json(
            { success: false, error: 'credential_not_stored' },
            { status: 400 }
        );
    }

    return NextResponse.json({
        success: true,
        id: credential.id,
        name: credential.name,
    });
}
