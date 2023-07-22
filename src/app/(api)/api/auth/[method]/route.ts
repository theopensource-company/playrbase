import { Email } from '@/constants/Types/Email.types';
import { fullname } from '@/lib/zod';
import { sessionLength } from '@api/config/auth';
import { MagicLinkVerification } from '@api/config/shared_schemas';
import { surreal } from '@api/lib/surreal';
import AuthMagicLinkEmail from '@email/auth-magic-link';
import { render } from '@react-email/components';
import { token_secret } from '@schema/auth';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
    identifier: z.string(),
    scope: z.union([z.literal('admin'), z.literal('user')]),
});

export const CreateProfile = MagicLinkVerification.extend({
    name: fullname(),
});

const Method = z.literal('magic-link');

export async function POST(
    req: Request,
    { params }: { params: { method: string } }
) {
    const method = Method.parse(params.method);
    const { identifier, scope } = Body.parse(await req.json());

    const [, , , res] = await surreal.query<
        [
            null,
            null,
            null,
            null | {
                challenge: string;
                email: string;
            }
        ]
    >(
        /* surrealql */ `
        LET $subject = (SELECT * FROM type::table($scope_name) WHERE email = $identifier)[0];
        LET $challenge = (CREATE auth_challenge SET method = $method, subject = ($subject.id OR $identifier));
        LET $email = $subject.email OR $identifier;
        IF (
            -- Admins cannot sign up
            -- Therefor, in case of an admin, we check if the user exists already
            -- Users can signup, they are allowed to continue
            ($subject.id OR $scope_name = 'user')

            -- Was the challenge created, and is the email valid? 
            -- (email is backup check, should have failed by earlier asserts if invalid)
            AND $challenge.challenge 
            AND is::email($email)
        ) THEN
            RETURN {
                challenge: $challenge.challenge,
                email: $email,
            };
        END;
    `,
        { identifier, scope_name: scope, method }
    );

    if (method == 'magic-link') {
        if (res.result) {
            const { challenge, email } = res.result;

            const body = Email.parse({
                from: 'noreply@playrbase.app',
                to: email,
                subject: 'PlayrBase signin link',
                text: render(
                    AuthMagicLinkEmail({ challenge, identifier: email }),
                    {
                        plainText: true,
                    }
                ),
                html: render(
                    AuthMagicLinkEmail({ challenge, identifier: email })
                ),
            } satisfies Email);

            await fetch('http://127.0.0.1:13004/email/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json(
        { success: false, error: 'invalid_method' },
        { status: 400 }
    );
}

export async function GET(
    req: NextRequest,
    { params }: { params: { method: string } }
) {
    const method = z.union([Method, z.literal('token')]).parse(params.method);

    if (method == 'token') {
        const token = req.cookies.get('playrbase-token')?.value;
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'missing_token',
                },
                {
                    headers: {
                        'Set-Cookie': 'playrbase-token=; MaxAge=0;',
                    },
                }
            );
        } else if (!isTokenValid({ token })) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'invalid_token',
                },
                {
                    headers: {
                        'Set-Cookie': 'playrbase-token=; MaxAge=0;',
                    },
                }
            );
        } else {
            return NextResponse.json({ success: true, token });
        }
    }

    const search = Object.fromEntries(new URL(req.url).searchParams.entries());
    const { identifier, challenge } = MagicLinkVerification.parse(search);

    const verifyChallenge = async (challenge: string) =>
        (
            await surreal.query<
                [
                    null,
                    null,
                    (
                        | null
                        | 'empty-profile'
                        | {
                              SC: string;
                              ID: string;
                          }
                    )
                ]
            >(
                /* surrealql */ `
                    LET $verification = (SELECT * FROM auth_challenge WHERE method = $method AND challenge = $challenge AND created > time::now() - 30m)[0];
                    LET $subject = (SELECT * FROM type::thing($verification.subject) WHERE email = $identifier)[0];
                    IF (!!$subject.id) THEN {
                        RETURN {
                            SC: meta::tb($subject.id),
                            ID: $subject.id
                        };
                    } ELSE IF (!!$verification.id) THEN {
                        RETURN "empty-profile";
                    } END;
                `,
                { identifier, challenge, method }
            )
        )[2];

    if (method == 'magic-link') {
        const res = await verifyChallenge(challenge);
        if (res.result == 'empty-profile') {
            const url = `/account/create-profile?${new URLSearchParams({
                identifier,
                challenge,
            })}`;

            return new NextResponse(`Success! Redirecting to ${url}`, {
                status: 302,
                headers: {
                    Location: url,
                },
            });
        } else if (res.result) {
            const { SC, SC: TK, ID } = res.result;
            const { header } = generateToken({ SC, TK, ID });

            return new NextResponse('Success! Redirecting to /console', {
                status: 302,
                headers: {
                    Location: '/console',
                    'Set-Cookie': header,
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { success: false, error: 'invalid_method' },
        { status: 400 }
    );
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { method: string } }
) {
    const method = Method.parse(params.method);
    console.log(1, method);
    const { identifier, challenge, name } = CreateProfile.parse(
        await req.json()
    );

    console.log(2, { identifier, challenge, name });

    const createProfile = async (challenge: string) =>
        (
            await surreal.query<
                [
                    null,
                    null,
                    null | {
                        SC: string;
                        ID: string;
                    }
                ]
            >(
                /* surrealql */ `
                    LET $verification = (SELECT * FROM auth_challenge WHERE method = $method AND challenge = $challenge AND subject = $identifier AND created > time::now() - 30m)[0];
                    LET $subject = CREATE user CONTENT {
                        email: $identifier,
                        name: $name
                    };

                    IF (!!$subject.id) THEN {
                        RETURN {
                            SC: meta::tb($subject.id),
                            ID: $subject.id
                        };
                    } END;
                `,
                { identifier, challenge, name, method }
            )
        )[2];

    if (method == 'magic-link') {
        const res = await createProfile(challenge);
        console.log(3, res);
        if (res.result) {
            const { SC, SC: TK, ID } = res.result;
            const { header, token } = generateToken({ SC, TK, ID });

            return NextResponse.json(
                {
                    success: true,
                    token,
                },
                {
                    status: 200,
                    headers: {
                        'Set-Cookie': header,
                    },
                }
            );
        }

        return NextResponse.json(
            { success: false, error: 'invalid_credentials' },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { success: false, error: 'invalid_method' },
        { status: 400 }
    );
}

function generateToken({ SC, TK, ID }: { SC: string; TK: string; ID: string }) {
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
            iss: 'playrbase.app',
            exp: Math.floor(Date.now() / 1000) + maxAge,
        },
        token_secret,
        {
            algorithm: 'HS512',
        }
    );

    const header = `playrbase-token=${token}; HttpOnly; Max-Age=${maxAge}; Path=/api/auth; SameSite=Strict; Secure;`;

    return { token, header, maxAge };
}

function isTokenValid({ token }: { token: string }) {
    try {
        jwt.verify(token, token_secret, {
            issuer: 'playrbase.app',
            algorithms: ['HS512'],
        });

        return true;
    } catch (_e) {
        console.log(_e);
        return false;
    }
}
