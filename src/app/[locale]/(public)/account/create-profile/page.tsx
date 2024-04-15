'use client';

import Container from '@/components/layout/Container';
import {
    BirthdateSelector,
    useBirthdateSelector,
} from '@/components/logic/BirthdateSelector';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import { useAuth } from '@/lib/auth';
import { privacy_policy } from '@/lib/branding';
import { useFeatureFlags } from '@/lib/featureFlags';
import { cn } from '@/lib/utils';
import { useWebAuthnAvailable } from '@/lib/webauthn';
import { fullname } from '@/lib/zod';
import { useRouter } from '@/locales/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import jwt from 'jsonwebtoken';
import { Info, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = z.object({
    name: fullname(),
});

type Schema = z.infer<typeof Schema>;

export default function CreateProfile() {
    const surreal = useSurreal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = z.string().parse(searchParams.get('token'));
    const followup = z
        .string()
        .optional()
        .nullable()
        .parse(searchParams.get('followup'));
    const { refreshUser } = useAuth();
    const decoded = jwt.decode(token);
    const webAuthnAvailable = useWebAuthnAvailable();
    const [featureFlags] = useFeatureFlags();
    const birthdateSelector = useBirthdateSelector({ token });
    const { birthdate, birthdatePermit, isBirthdateReady } = birthdateSelector;

    const t = useTranslations('pages.account.create-profile');
    const [status, setStatus] = useState<{
        error?: boolean;
        message?: string;
        loading?: boolean;
    }>({});

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
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
        } else if (errors.name?.message) {
            set(errors.name.message);
        }
    }, [errors, status, setStatus]);

    const handler = handleSubmit(async ({ name }) => {
        setStatus({ message: 'Loading', loading: true });

        const raw = await fetch('/api/auth/magic-link', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                token,
                birthdate,
                birthdate_permit: birthdatePermit,
            }),
        });

        const res = await raw.json().catch((_e) => ({
            success: false,
            error: 'unexpected_server_error',
        }));

        if (res.success) {
            await surreal
                .authenticate(res.token)
                .then(() => {
                    refreshUser();
                    const params = new URLSearchParams();
                    params.set('signup', '');
                    if (followup) params.set('followup', followup);

                    router.push(
                        featureFlags.passkeys && webAuthnAvailable
                            ? `/account/create-passkey?${params}`
                            : followup ?? '/account'
                    );
                })
                .catch((e) => {
                    setStatus({
                        message: `An error occurred: ${e.error}`,
                        error: true,
                    });
                });
        } else {
            setStatus({
                message: `An error occurred: ${res.error}`,
                error: true,
            });
        }
    });

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            <form
                className="flex flex-col items-center gap-8"
                onSubmit={handler}
            >
                <Card className="flex flex-col gap-3 max-sm:border-none max-sm:px-0">
                    <CardHeader className="w-96 max-w-full">
                        <CardTitle className="text-3xl font-bold">
                            {t('title')}
                        </CardTitle>
                        <CardDescription>{t('tagline')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-1">
                        <div className="max-w-md space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">
                                    {t('input.name.label')}
                                </Label>
                                <Input
                                    placeholder={t('input.name.placeholder')}
                                    {...register('name')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">
                                    {t('input.birthdate.label')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('input.birthdate.description')}
                                </p>
                                <BirthdateSelector {...birthdateSelector} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">
                                    {t('input.email.label')}
                                </Label>
                                <Input
                                    placeholder={t('input.email.placeholder')}
                                    defaultValue={
                                        (typeof decoded == 'object' &&
                                            decoded?.sub) ||
                                        ''
                                    }
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="h-4">
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
                    <CardFooter className="flex flex-col gap-6">
                        <Button
                            disabled={!isValid || !isBirthdateReady}
                            type="submit"
                        >
                            {t('button.continue')}
                        </Button>
                        {privacy_policy && (
                            <p className="text-xs text-muted-foreground">
                                {t.rich('privacy-policy', {
                                    link: (children) => (
                                        <Link
                                            href={privacy_policy ?? '#'}
                                            target="_blank"
                                            className="text-foreground hover:underline"
                                        >
                                            {children}
                                        </Link>
                                    ),
                                })}
                            </p>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </Container>
    );
}
