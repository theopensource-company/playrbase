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
import { surreal } from '@/lib/Surreal';
import { useRegisterPasskey } from '@/lib/webauthn';
import { Credential } from '@/schema/resources/credential';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                <Card className="flex flex-col gap-3">
                    <CardHeader className="w-96 max-w-full">
                        <CardTitle className="text-3xl font-bold">
                            Create a Passkey
                        </CardTitle>
                        <CardDescription>
                            Use a passkey to easily and securely authenticate
                            yourself
                        </CardDescription>
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
    return (
        <CardFooter className="space-x-4">
            <Button onClick={() => register()} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Passkey
            </Button>
            <Link
                href={signup ? '/account' : '/account/passkeys'}
                className={buttonVariants({
                    variant: 'outline',
                })}
            >
                {signup ? 'Skip' : 'Back'}
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
    const router = useRouter();

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
                <Label htmlFor="name">Passkey Name</Label>
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
                    Save name
                </Button>
                {errors?.root && (
                    <p className="text-red-600">{errors.root.message}</p>
                )}
            </CardFooter>
        </form>
    );
}
