import { Deployed } from '@/config/Environment';
import { client } from '@passwordless-id/webauthn';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useSurreal } from './Surreal';
import { useAuth } from './auth';
import { useReadyAfter } from './utilHooks';

// About the usage of the "useReadyAfter" hook in this file.
// We want to automatically ask for the user to create or apply a passkey
// But we need to trigger those hooks ONLY ONCE
// Now, I like React Strict mode, but I need to hack around it for this scenario.
// Somehow, when using something like a reference to track any invocation
// It would break tanstack query, so doing it a bit different

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

const RegistrationResponse = z.discriminatedUnion('success', [
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

const AuthenticationResponse = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        name: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export function useWebAuthnAvailable() {
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        if (client.isAvailable()) setAvailable(true);
    }, [setAvailable]);

    return available;
}

export function useRegisterPasskey() {
    const [didPoke, setDidPoke] = useState(false);
    const { user, loading: userLoading } = useAuth();
    const ready = useReadyAfter(10);

    const {
        isLoading: isRegistering,
        mutate: register,
        data: passkey,
    } = useMutation({
        mutationKey: ['register-passkey'],
        async mutationFn() {
            if (!user) return null;
            const { id: challengeId, challenge } = await fetch(
                `/api/auth/passkey/challenge?` +
                    new URLSearchParams({
                        user: user.id,
                    }).toString()
            )
                .then(async (res) => ChallengeResponse.parse(await res.json()))
                .then((res) => {
                    if (res.success) return res;

                    throw new Error(`Failed to obtain challenge: ${res.error}`);
                });

            const registration = await client.register(user.email, challenge, {
                userHandle: crypto
                    .getRandomValues(new Uint8Array(32))
                    .toString()
                    .slice(64),
            });

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
                .then(async (res) =>
                    RegistrationResponse.parse(await res.json())
                )
                .then((res) => {
                    if (res.success) return res;

                    throw new Error(
                        `Failed to create credential: ${res.error}`
                    );
                });

            return { credentialId, name, registration };
        },
    });

    const loading = userLoading || isRegistering;

    useEffect(() => {
        if (ready && !loading && user && !didPoke) {
            register();
            setDidPoke(true);
        }
    }, [ready, loading, user, register, didPoke, setDidPoke]);

    return { loading, register, passkey };
}

export function usePasskeyAuthentication() {
    const [didPoke, setDidPoke] = useState(false);
    const { refreshUser } = useAuth();
    const ready = useReadyAfter(10);
    const surreal = useSurreal();

    const {
        isLoading: loading,
        mutate: authenticate,
        data: passkey,
    } = useMutation({
        mutationKey: ['authenticate-passkey'],
        async mutationFn() {
            const { id: challengeId, challenge } = await fetch(
                '/api/auth/passkey/challenge'
            )
                .then(async (res) => ChallengeResponse.parse(await res.json()))
                .then((res) => {
                    if (res.success) return res;

                    throw new Error(`Failed to obtain challenge: ${res.error}`);
                });

            const authentication = await client
                .authenticate([], challenge)
                .catch(() => false);

            if (!authentication) return null;

            const { name } = await fetch('/api/auth/passkey/authenticate', {
                method: 'POST',
                body: JSON.stringify({
                    challengeId,
                    authentication,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(async (res) =>
                    AuthenticationResponse.parse(await res.json())
                )
                .then(async (res) => {
                    if (res.success) {
                        const token = await fetch('/api/auth/token')
                            .then((res) => res.json())
                            .then((res) => {
                                if (res.success) return res.token as string;
                                console.error(
                                    `Failed to retrieve token: ${res.error}`
                                );
                            });

                        try {
                            if (token) await surreal.authenticate(token);
                            await refreshUser();
                        } catch (e) {
                            console.error(
                                `Failed to authenticate with token: ${e}`
                            );
                        }

                        return res;
                    }

                    throw new Error(
                        `Failed to authenticate credential: ${res.error}`
                    );
                });

            return { name, authentication };
        },
    });

    useEffect(() => {
        if (ready && !loading && !didPoke) {
            authenticate();
            setDidPoke(true);
        }
    }, [ready, loading, authenticate, didPoke, setDidPoke]);

    return { loading, authenticate, passkey };
}
