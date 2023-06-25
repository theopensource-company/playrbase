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
import { ChevronsUpDown, Info, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';
import React, { createRef, useCallback, useState } from 'react';

type scope = 'player' | 'manager' | 'admin';

export default function Signin() {
    const t = useTranslations('pages.account.signin');
    const [scope, setScope] = useState<scope>('player');
    const [status, setStatus] = useState<{
        error?: boolean;
        message?: string;
        loading?: boolean;
    }>({});
    const emailRef = createRef<HTMLInputElement>();

    const submitEmail = useCallback(async () => {
        const identifier = emailRef.current?.value;
        if (!identifier) {
            setStatus({ message: 'Please enter your email', error: true });
            return;
        }

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
    }, [emailRef, scope]);

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-8">
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
                                    <DropdownMenuRadioItem value="player">
                                        {t('scope.player')}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="manager">
                                        {t('scope.manager')}
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
                            ref={emailRef}
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
                        <Button onClick={submitEmail}>
                            {t('button.continue')}
                        </Button>
                    </CardFooter>
                </Card>
                <Link
                    href="/account/create"
                    className="text-muted-foreground hover:text-foreground"
                >
                    {t('link.create-account')}
                </Link>
            </div>
        </Container>
    );
}
