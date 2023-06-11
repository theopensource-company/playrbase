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
import { ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next-intl/link';
import React, { createRef, useCallback, useState } from 'react';

type scope = 'player' | 'manager' | 'admin';

export default function Signin() {
    const t = useTranslations('pages.account.signin');
    const [scope, setScope] = useState<scope>('player');
    const emailRef = createRef<HTMLInputElement>();

    const submitEmail = useCallback(() => {
        const email = emailRef.current?.value;
        if (!email) return alert('no email set');
        alert(`Scope: ${scope}. Email: ${email}`);
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
