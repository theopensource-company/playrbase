'use client';

import Container from '@/components/layout/Container';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useRegisterPasskey } from '@/lib/webauthn';
import { Credential } from '@/schema/resources/credential';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/client';
import Link from 'next-intl/link';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Page() {
    const { loading, register, passkey } = useRegisterPasskey();
    const searchParams = useSearchParams();
    const signup = [...searchParams.keys()].includes('signup');
    const t = useTranslations('pages.account.create-passkey');
    useAuth({ authRequired: true });

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <Card className="flex flex-col gap-3">
                    <CardHeader className="w-96 max-w-full">
                        <CardTitle className="text-3xl font-bold">
                            {t('title')}
                        </CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </CardHeader>
                    {passkey ? (
                        <UpdateName passkey={passkey} signup={signup} />
                    ) : (
                        <CreatePasskey
                            loading={loading}
                            register={register}
                            signup={signup}
                        />
                    )}
                </Card>
            </div>
        </Container>
    );
}

function CreatePasskey({
    loading,
    register,
    signup,
}: Pick<ReturnType<typeof useRegisterPasskey>, 'loading' | 'register'> & {
    signup?: boolean;
}) {
    const t = useTranslations('pages.account.create-passkey.pre');
    return (
        <CardFooter className="space-x-4">
            <Button onClick={() => register()} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('trigger')}
            </Button>
            <Link
                href={signup ? '/account' : '/account/passkeys'}
                className={buttonVariants({
                    variant: 'outline',
                })}
            >
                {signup ? t('skip') : t('back')}
            </Link>
        </CardFooter>
    );
}

function UpdateName({
    signup,
    passkey,
}: {
    signup?: boolean;
    passkey: Exclude<
        ReturnType<typeof useRegisterPasskey>['passkey'],
        null | undefined
    >;
}) {
    const surreal = useSurreal();
    const router = useRouter();
    const t = useTranslations('pages.account.create-passkey.created');

    const Schema = Credential.pick({
        name: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name }) => {
        await surreal.merge(passkey.credentialId, { name });
        router.push(signup ? '/account' : '/account/passkeys');
    });

    return (
        <form onSubmit={handler}>
            <CardContent className="flex flex-col gap-2 pt-1">
                <Label htmlFor="name">{t('label')}</Label>
                <Input
                    id="name"
                    placeholder={passkey.name}
                    maxLength={Schema.shape.name.maxLength ?? undefined}
                    autoComplete="off"
                    {...register('name')}
                />
                {errors?.name && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.name.message}</p>
                )}
            </CardContent>
            <CardFooter>
                <Button disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('trigger')}
                </Button>
                {errors?.root && (
                    <p className="text-red-600">{errors.root.message}</p>
                )}
            </CardFooter>
        </form>
    );
}
