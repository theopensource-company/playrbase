'use client';

import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TAdminRecord } from '@/constants/Types/Admin.types';
import { TOrganisationRecord } from '@/constants/Types/Organisation.types';
import { TPlayerRecord } from '@/constants/Types/Player.types';
import { AnyUser, useAuth } from '@/lib/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/client';
import React, { useEffect, useState } from 'react';

export default function DashboardPage() {
    const router = useRouter();

    const { user, loading } = useAuth(({ user, loading }) => ({
        user,
        loading,
    }));

    const [name, setName] = useState<AnyUser['name']>();

    useEffect(() => {
        if (!loading && !user) router.push('/account/signin');
        if (!loading && user) setName(user.name);
    }, [user, loading, router]);

    const t = useTranslations('pages.dashboard');

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            <Card className="flex flex-col gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="capitalize"
                            role="combobox"
                        >
                            {name}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuRadioGroup
                            onValueChange={(s) => setName(s as AnyUser['name'])}
                        >
                            <DropdownMenuRadioItem value="Example Player">
                                {'Example Player'}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Example Manager">
                                {'Example Manager'}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Example Admin">
                                {'Example Admin'}
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Card>
        </Container>
    );
}
