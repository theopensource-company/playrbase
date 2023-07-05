'use client';

import Container from '@/components/layout/Container';
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
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronsUpDown, Info, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type scope = 'user' | 'admin';

const Schema = z.object({
    identifier: z.string().email({ message: 'Enter a valid email address!' }),
});

type Schema = z.infer<typeof Schema>;

export default function Signin() {
    const defaultScope =
        (typeof window !== 'undefined' &&
            (localStorage.getItem('signin.default-scope') as scope)) ||
        'user';

    const t = useTranslations('pages.account.signin');
    const [scope, setScope] = useState<scope>(defaultScope);
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

    const handler = handleSubmit(async ({ identifier }) => {
        setStatus({ message: 'Loading', loading: true });

        const raw = await fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, scope }),
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
        <Container className="flex flex-grow flex-col items-center justify-center">
            <form
                className="flex flex-col items-center gap-8"
                onSubmit={handler}
            >
                <Card className="flex flex-col gap-4">
                    <CardHeader className="flex flex-row justify-between gap-24">
                        <div>
                            <CardTitle className="text-3xl font-bold">
                                {t('title')}
                            </CardTitle>
                            <CardDescription>{t('tagline')}</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="capitalize"
                                    role="combobox"
                                >
                                    {t(`scope.${scope}`)}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuRadioGroup
                                    value={scope}
                                    onValueChange={(s) => setScope(s as scope)}
                                >
                                    <DropdownMenuRadioItem value="user">
                                        {t('scope.user')}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="admin">
                                        {t('scope.admin')}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder={t('input.email.placeholder')}
                            {...register('identifier')}
                        />
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
                    <CardFooter>
                        <Button type="submit">{t('button.continue')}</Button>
                    </CardFooter>
                </Card>
                <Link
                    href="/account/create"
                    className="text-muted-foreground hover:text-foreground"
                >
                    {t('link.create-account')}
                </Link>
            </form>
        </Container>
    );
}
