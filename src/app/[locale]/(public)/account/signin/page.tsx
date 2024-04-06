'use client';

import Container from '@/components/layout/Container';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { DropdownMenuOptionalBoolean } from '@/components/logic/DropdownMenuOptionalBoolean';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/lib/featureFlags';
import { cn } from '@/lib/utils';
import { useAutoPoke, usePasskeyAuthentication } from '@/lib/webauthn';
import { useRouter } from '@/locales/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Cog, Info, KeyRound, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
    identifier: z.string().email({ message: 'Enter a valid email address!' }),
});

type Schema = z.infer<typeof Schema>;

export default function Signin() {
    const [autoPoke, setAutoPoke] = useAutoPoke();

    const {
        loading: passkeyLoading,
        authenticate: tryPasskey,
        passkey,
    } = usePasskeyAuthentication({ autoPoke });
    const [featureFlags] = useFeatureFlags();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultEmail = searchParams.get('email');
    const followup = (() => {
        const raw = searchParams.get('followup');
        if (!raw) return undefined;
        return raw.startsWith('/') ? raw : `/${raw}`;
    })();

    const [navigating, setNavigating] = useState(false);
    const t = useTranslations('pages.account.signin');
    const { user, loading: userLoading } = useAuth();
    const [status, setStatus] = useState<{
        error?: boolean;
        message?: string;
        loading?: boolean;
    }>({});

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    // Dirty solution, will fix later :)
    useEffect(() => {
        const set = (message: string) => {
            if (!status.error && status.message !== message) {
                setStatus({
                    error: true,
                    message,
                });
            }
        };

        if (errors.root?.message) {
            set(errors.root.message);
        } else if (errors.identifier?.message) {
            set(errors.identifier.message);
        }
    }, [errors, status, setStatus]);

    useEffect(() => {
        if (!navigating && passkey) {
            setNavigating(true);
            setTimeout(() => {
                router.push(followup ?? '/account');
            }, 1000);
        }
    }, [navigating, passkey, router, followup]);

    useEffect(() => {
        if (
            defaultEmail &&
            followup &&
            !userLoading &&
            user?.email == defaultEmail
        ) {
            router.push(followup);
        }
    });

    useEffect(() => {
        if (passkey && autoPoke !== false) setAutoPoke(true);
    }, [passkey, autoPoke, setAutoPoke]);

    const handler = handleSubmit(async ({ identifier }) => {
        setStatus({ message: 'Loading', loading: true });

        const raw = await fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, followup }),
        });

        const res = await raw.json().catch((_e) => ({
            success: false,
            error: 'unexpected_server_error',
        }));

        if (res.success) {
            setStatus({ message: 'Check your mailbox and spambox' });
        } else {
            setStatus({
                message: `An error occurred: ${res.error}`,
                error: true,
            });
        }
    });

    return (
        <>
            {userLoading && <LoaderOverlay />}
            <Container className="flex flex-grow flex-col items-center justify-center">
                <form
                    className="flex flex-col items-center gap-8"
                    onSubmit={handler}
                >
                    <Card className="flex flex-col max-sm:border-none max-sm:px-0">
                        <CardHeader className="flex flex-row justify-between gap-24">
                            <div>
                                <CardTitle className="text-3xl font-bold">
                                    {t('title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('tagline')}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!passkey ? (
                                <Input
                                    className="mt-2"
                                    placeholder={t('input.email.placeholder')}
                                    defaultValue={defaultEmail ?? undefined}
                                    disabled={!!passkey || passkeyLoading}
                                    {...register('identifier')}
                                />
                            ) : (
                                <div className="space-y-1">
                                    <Label className="opacity-60">
                                        {t('input.passkey.label')}
                                    </Label>
                                    <div className="text-md flex items-center justify-between rounded-md border px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <KeyRound className="h-5 w-5" />{' '}
                                            {passkey.name}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="h-4 pt-2">
                                {status.message && (
                                    <p
                                        className={cn(
                                            'flex items-center gap-1.5 pl-1 text-sm text-muted-foreground',
                                            status.error && 'text-red-700'
                                        )}
                                    >
                                        {status.loading ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : status.error ? (
                                            <XCircle size={16} />
                                        ) : (
                                            <Info size={16} />
                                        )}
                                        {status.message}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        {!passkey && (
                            <CardFooter className="space-x-4">
                                <Button
                                    type="submit"
                                    disabled={!!passkey || passkeyLoading}
                                >
                                    {t('button.continue')}
                                </Button>
                                {featureFlags.passkeys && (
                                    <Button
                                        type="button"
                                        className={
                                            passkey ? ' bg-green-500' : ''
                                        }
                                        onClick={() => tryPasskey()}
                                        variant={
                                            passkey ? 'default' : 'outline'
                                        }
                                        disabled={passkeyLoading}
                                    >
                                        {passkeyLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <KeyRound className="mr-2 h-4 w-4" />
                                        )}
                                        {t('button.passkey')}
                                    </Button>
                                )}
                            </CardFooter>
                        )}
                    </Card>
                </form>
            </Container>
            <DropdownMenu>
                <DropdownMenuTrigger
                    asChild
                    className="fixed bottom-0 right-0 m-8"
                >
                    <Button size="icon" variant="outline">
                        <Cog className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>{t('options.label')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuOptionalBoolean
                        value={autoPoke}
                        onValueChange={setAutoPoke}
                        title={t('options.passkey-auto-poke.label')}
                        options={{
                            undefined: t('options.passkey-auto-poke.undefined'),
                            false: t('options.passkey-auto-poke.false'),
                            true: t('options.passkey-auto-poke.true'),
                        }}
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
