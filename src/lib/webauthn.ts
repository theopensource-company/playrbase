import { client } from '@passwordless-id/webauthn';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuth } from './auth';

export function useWebAuthnAvailable() {
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        if (client.isAvailable()) setAvailable(true);
    }, [setAvailable]);

    return available;
}

const ChallengeResponse = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        id: z.string(),
        challenge: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

const CredentialResponse = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        id: z.string(),
        name: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export function useRegisterPasskey() {
    const [didPoke, setDidPoke] = useState(false);
    const { user, loading: userLoading } = useAuth();

    const {
        isLoading: isRegistering,
        mutate: register,
        data: passkey,
    } = useMutation({
        mutationKey: ['register-passkey'],
        async mutationFn() {
            if (!user) return null;
            const { id: challengeId, challenge } = await fetch(
                '/api/auth/passkey/challenge'
            )
                .then(async (res) => ChallengeResponse.parse(await res.json()))
                .then((res) => {
                    if (res.success) return res;

                    throw new Error(`Failed to obtain challenge: ${res.error}`);
                });

            const registration = await client
                .register(user.email, challenge, {
                    userHandle: crypto
                        .getRandomValues(new Uint8Array(32))
                        .toString()
                        .slice(64),
                })
                .catch((e) => e);

            const { id: credentialId, name } = await fetch(
                '/api/auth/passkey/register',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        challengeId,
                        registration,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )
                .then(async (res) => CredentialResponse.parse(await res.json()))
                .then((res) => {
                    if (res.success) return res;

                    throw new Error(`Failed to obtain challenge: ${res.error}`);
                });

            return { credentialId, name, registration };
        },
    });

    const loading = userLoading || isRegistering;

    useEffect(() => {
        if (!userLoading && user && !isRegistering && !didPoke) {
            register();
            setDidPoke(true);
        }
    }, [userLoading, user, register, isRegistering, didPoke, setDidPoke]);

    return { loading, register, passkey };
}
