import { client } from '@passwordless-id/webauthn';
import { useMutation } from '@tanstack/react-query';
import { SetStateAction, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useSurreal } from './Surreal';
import { useAuth } from './auth';
import { useFeatureFlags } from './featureFlags';
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

export function useAutoPoke() {
    const [autoPoke, setAutoPoke] = useState<boolean | undefined>();

    const updatePreference = useCallback(
        (newValue: SetStateAction<boolean | undefined>, persist = true) => {
            const value =
                typeof newValue == 'function' ? newValue(autoPoke) : newValue;
            setAutoPoke(value);
            if (persist && typeof window !== 'undefined') {
                if (typeof value == 'undefined') {
                    localStorage.removeItem('auto-poke');
                } else {
                    localStorage.setItem('auto-poke', value.toString());
                }
            }
        },
        [autoPoke, setAutoPoke]
    );

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const state = localStorage.getItem('auto-poke');
            setAutoPoke(state == null ? undefined : state == 'true');
        }
    }, [setAutoPoke]);

    return [autoPoke, updatePreference] as const;
}

export function useRegisterPasskey() {
    const [featureFlags] = useFeatureFlags();
    const { user, loading: userLoading } = useAuth();

    const {
        isPending: isRegistering,
        mutate: register,
        data: passkey,
    } = useMutation({
        mutationKey: ['register-passkey'],
        async mutationFn() {
            if (!user) return null;
            if (!featureFlags.passkeys) return null;
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

            const registration = await client
                .register(user.email, challenge, {
                    userHandle: crypto
                        .getRandomValues(new Uint8Array(32))
                        .toString()
                        .slice(64),
                })
                .catch(() => false);

            if (!registration) return null;

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
    return { loading, register, passkey };
}

export function usePasskeyAuthentication({
    autoPoke,
}: { autoPoke?: boolean } = {}) {
    const [featureFlags] = useFeatureFlags();
    const [didPoke, setDidPoke] = useState(false);
    const { refreshUser } = useAuth();
    const ready = useReadyAfter(10);
    const surreal = useSurreal();

    const {
        isPending: loading,
        mutate: authenticate,
        data: passkey,
    } = useMutation({
        mutationKey: ['authenticate-passkey'],
        async mutationFn() {
            if (!featureFlags.passkeys) return null;
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
        if (ready && autoPoke && !loading && !didPoke) {
            authenticate();
            setDidPoke(true);
        }
    }, [ready, autoPoke, loading, authenticate, didPoke, setDidPoke]);

    return { loading, authenticate, passkey };
}
